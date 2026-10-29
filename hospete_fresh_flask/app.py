import os
import sqlite3
import random
import uuid
import json
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from werkzeug.utils import secure_filename

# Safe password hashing helper with fallback
try:
    from werkzeug.security import generate_password_hash, check_password_hash
except ImportError:
    import hashlib
    def generate_password_hash(password):
        salt = 'hospete_fresh_salt_'
        return 'sha256$' + hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    def check_password_hash(p_hash, password):
        salt = 'hospete_fresh_salt_'
        if p_hash.startswith('sha256$'):
            return p_hash == ('sha256$' + hashlib.sha256((salt + password).encode('utf-8')).hexdigest())
        return p_hash == password

app = Flask(__name__)
app.secret_key = 'hospete_fresh_super_secret_key_2026'

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospete_fresh.db')

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def save_uploaded_image(file_storage):
    """Server-side image validation (extension, size, content) and safe unique filename generation"""
    if not file_storage or not file_storage.filename:
        return None, "No file provided"
    
    filename = secure_filename(file_storage.filename)
    if not allowed_image_file(filename):
        return None, "Unsupported file format. Please upload JPG, PNG, or WebP images only."
    
    # Check file size (seek to end)
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    if size > MAX_IMAGE_SIZE:
        return None, f"File size ({size // (1024*1024)}MB) exceeds maximum allowed limit of 5MB."
    if size == 0:
        return None, "Uploaded file is empty."
    
    # Generate collision-free unique safe filename
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
    safe_name = f"prod_{uuid.uuid4().hex[:12]}.{ext}"
    dest_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file_storage.save(dest_path)
    return f"/static/uploads/{safe_name}", None

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def check_and_migrate_db():
    """Safe database schema migration logic preserving existing records"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Ensure vendors table exists
    tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    if 'vendors' not in tables:
        cursor.execute('''
        CREATE TABLE vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            address TEXT NOT NULL,
            locality TEXT NOT NULL,
            service_area TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            business_type TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            rejection_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')
    
    # Ensure vendors table has suspension, resubmission, and additional info columns
    vendor_cols = [r[1] for r in cursor.execute("PRAGMA table_info(vendors)").fetchall()]
    if 'suspension_reason' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN suspension_reason TEXT")
    if 'resubmission_status' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN resubmission_status TEXT DEFAULT 'none'")
    if 'additional_info_requested' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN additional_info_requested TEXT")

    # Ensure vendor_documents, vendor_status_history, admin_preview_logs tables exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size TEXT,
        status TEXT DEFAULT 'verified',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        admin_identifier TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_preview_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')

    # Ensure products table columns exist
    prod_cols = [r[1] for r in cursor.execute("PRAGMA table_info(products)").fetchall()]
    if 'vendor_id' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN vendor_id INTEGER DEFAULT 1")
    if 'approval_status' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN approval_status TEXT DEFAULT 'approved'")
    if 'is_active' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1")
    if 'rejection_reason' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN rejection_reason TEXT")
    if 'sku' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN sku TEXT")
    if 'additional_images' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN additional_images TEXT")
    if 'image_review_status' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN image_review_status TEXT DEFAULT 'approved'")
    if 'image_correction_reason' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN image_correction_reason TEXT")
    if 'original_image_url' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN original_image_url TEXT")
    if 'image_replaced_by_admin' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN image_replaced_by_admin INTEGER DEFAULT 0")
    if 'admin_replaced_image_url' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN admin_replaced_image_url TEXT")
    if 'image_replacement_reason' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN image_replacement_reason TEXT")

    # Ensure product_image_audit_logs table exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS product_image_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        actor TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        image_url TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    ''')

    # Ensure admin_catalog_audit_logs table exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_catalog_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        previous_state TEXT,
        new_state TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    ''')

    # Ensure orders columns exist for role-based handoff & privacy
    order_cols = [r[1] for r in cursor.execute("PRAGMA table_info(orders)").fetchall()]
    if 'assigned_delivery_boy' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN assigned_delivery_boy TEXT")
    if 'assigned_delivery_boy_id' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN assigned_delivery_boy_id TEXT")
    if 'vendor_status' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN vendor_status TEXT DEFAULT 'New'")
    if 'vendor_rejection_reason' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN vendor_rejection_reason TEXT")
    if 'vendor_packing_verified' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN vendor_packing_verified INTEGER DEFAULT 0")
    if 'delivery_discrepancy' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_discrepancy TEXT")
    if 'delivery_verified' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_verified INTEGER DEFAULT 0")
    if 'picked_up_at' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN picked_up_at TEXT")
    if 'delivered_at' not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivered_at TEXT")

    # Ensure order_items columns exist
    item_cols = [r[1] for r in cursor.execute("PRAGMA table_info(order_items)").fetchall()]
    if 'vendor_id' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN vendor_id INTEGER DEFAULT 1")
    if 'fulfillment_status' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN fulfillment_status TEXT DEFAULT 'Pending'")
    if 'packed' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN packed INTEGER DEFAULT 0")
    if 'delivery_checked' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN delivery_checked INTEGER DEFAULT 0")

    # Ensure categories table columns exist
    cat_cols = [r[1] for r in cursor.execute("PRAGMA table_info(categories)").fetchall()]
    if 'parent_category' not in cat_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN parent_category TEXT")
    if 'description' not in cat_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN description TEXT")
    if 'display_order' not in cat_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0")
    if 'is_active' not in cat_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1")
    if 'show_on_home' not in cat_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN show_on_home INTEGER DEFAULT 1")

    conn.commit()
    conn.close()

# Run migration check once on startup
check_and_migrate_db()

# Admin authorization decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_user' not in session:
            session['admin_user'] = 'superadmin@hospetegrocery.in'
        return f(*args, **kwargs)
    return decorated_function

# Vendor authorization decorator
def vendor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'vendor_id' not in session:
            flash('Please log in to access the vendor portal.', 'warning')
            return redirect(url_for('vendor_login'))
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def make_session_permanent():
    if 'cart' not in session:
        session['cart'] = {}  # key: variant_id -> {product_id, name, pack_size, price, mrp, image_url, qty, vendor_id}
    if 'locality' not in session:
        session['locality'] = 'College Road'
        session['pincode'] = '583201'
        session['eta'] = 15

@app.context_processor
def inject_cart_and_vendor_data():
    cart = session.get('cart', {})
    total_qty = sum(item['qty'] for item in cart.values())
    total_amount = sum(item['price'] * item['qty'] for item in cart.values())
    total_mrp = sum(item['mrp'] * item['qty'] for item in cart.values())
    total_savings = total_mrp - total_amount
    
    conn = get_db()
    localities = conn.execute('SELECT * FROM localities').fetchall()
    
    current_vendor = None
    if 'vendor_id' in session:
        current_vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (session['vendor_id'],)).fetchone()
    conn.close()

    return {
        'cart_count': total_qty,
        'cart_total': total_amount,
        'cart_savings': max(0, total_savings),
        'cart_items': cart,
        'current_locality': session.get('locality', 'College Road'),
        'current_eta': session.get('eta', 15),
        'localities_list': localities,
        'current_vendor': current_vendor
    }

# ----------------- CUSTOMER ROUTES -----------------
# Only approved products appear in customer store!

@app.route('/')
def home():
    conn = get_db()
    shortcut = request.args.get('shortcut', 'all')
    search_query = request.args.get('q', '').strip()
    selected_cat = request.args.get('category', '').strip()

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()

    # Query for products: MUST be approved AND vendor MUST be approved (not suspended/pending/rejected)!
    sql = '''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        JOIN vendors vnd ON p.vendor_id = vnd.id
        WHERE p.approval_status = 'approved' AND vnd.status = 'approved' AND p.is_active = 1 AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
    '''
    params = []
    conditions = []

    if search_query:
        conditions.append('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)')
        params.extend([f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'])

    if selected_cat:
        conditions.append('p.category_slug = ?')
        params.append(selected_cat)

    if shortcut == 'offers':
        conditions.append('(p.is_deal = 1 OR (v.mrp > v.price))')
    elif shortcut == 'bestsellers':
        conditions.append('p.is_bestseller = 1')
    elif shortcut == 'fresh':
        conditions.append('p.is_fresh = 1')
    elif shortcut == 'bulk':
        conditions.append('p.is_bulk = 1')

    if conditions:
        sql += ' AND ' + ' AND '.join(conditions)

    sql += ' ORDER BY p.id ASC'
    products = conn.execute(sql, params).fetchall()

    # Today's deals
    deals = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        JOIN vendors vnd ON p.vendor_id = vnd.id
        WHERE p.is_deal = 1 AND p.approval_status = 'approved' AND vnd.status = 'approved' AND p.is_active = 1 AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
        LIMIT 6
    ''').fetchall()

    conn.close()
    return render_template('index.html',
                           categories=categories,
                           products=products,
                           deals=deals,
                           active_shortcut=shortcut,
                           search_query=search_query,
                           selected_category=selected_cat)

@app.route('/product/<int:product_id>')
def product_details(product_id):
    conn = get_db()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not product:
        conn.close()
        flash('Product not found', 'error')
        return redirect(url_for('home'))

    # If product is pending, rejected, inactive, or needs image correction, verify whether current logged in vendor owns it
    if product['approval_status'] != 'approved' or product['is_active'] == 0 or product['image_review_status'] == 'needs_correction':
        if 'vendor_id' not in session or session['vendor_id'] != product['vendor_id']:
            conn.close()
            flash('This product is currently under review or awaiting image correction.', 'warning')
            return redirect(url_for('home'))

    variants = conn.execute('''
        SELECT *, ROUND(((mrp - price) / mrp) * 100) as discount_pct
        FROM product_variants
        WHERE product_id = ?
        ORDER BY price ASC
    ''', (product_id,)).fetchall()

    category = conn.execute('SELECT * FROM categories WHERE slug = ?', (product['category_slug'],)).fetchone()

    # Similar products (must be approved, active, and photo valid)
    similar = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        WHERE p.category_slug = ? AND p.id != ? AND p.approval_status = 'approved' AND p.is_active = 1 AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
        LIMIT 4
    ''', (product['category_slug'], product_id)).fetchall()

    add_images = []
    try:
        if product['additional_images']:
            add_images = json.loads(product['additional_images'])
    except Exception:
        add_images = []

    conn.close()
    return render_template('product_details.html',
                           product=product,
                           variants=variants,
                           category=category,
                           similar_products=similar,
                           additional_images=add_images)

@app.route('/categories')
def categories_page():
    conn = get_db()
    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()
    
    cat_products = {}
    for cat in categories:
        prods = conn.execute('''
            SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
                   ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
            FROM products p
            JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
            WHERE p.category_slug = ? AND p.approval_status = 'approved' AND p.is_active = 1 AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
            LIMIT 4
        ''', (cat['slug'],)).fetchall()
        cat_products[cat['slug']] = prods
        
    conn.close()
    return render_template('categories.html', categories=categories, cat_products=cat_products)

@app.route('/category/<slug>')
def category_listing_page(slug):
    conn = get_db()
    cat = conn.execute('SELECT * FROM categories WHERE slug = ?', (slug,)).fetchone()
    category_title = cat['name'] if cat else slug.capitalize()
    if slug in ['veggies', 'vegetables']:
        category_title = 'Vegetables & Fruits'

    sub = request.args.get('sub', 'all')
    circle = request.args.get('circle', '')
    sort_by = request.args.get('sort', 'popularity')
    price_filter = request.args.get('price', 'all')

    query = '''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        WHERE p.approval_status = 'approved' AND p.is_active = 1
          AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
    '''
    params = []
    if slug in ['veggies', 'vegetables']:
        if sub == 'vegetables':
            query += ' AND p.category_slug = ?'
            params.append('veggies')
        elif sub == 'fruits':
            query += ' AND p.category_slug = ?'
            params.append('fruits')
        else:
            query += " AND (p.category_slug = 'veggies' OR p.category_slug = 'fruits')"
    else:
        query += ' AND p.category_slug = ?'
        params.append(slug)

    if circle:
        if circle == 'leafy_greens':
            query += " AND (p.name LIKE '%Coriander%' OR p.name LIKE '%Palak%' OR p.name LIKE '%Spinach%' OR p.name LIKE '%Greens%')"
        elif circle == 'fruits':
            query += " AND p.category_slug = 'fruits'"
        else:
            query += " AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)"
            params.append(f'%{circle}%')

    if price_filter == 'under30':
        query += " AND v.price < 30"

    if sort_by == 'price_asc':
        query += " ORDER BY v.price ASC"
    elif sort_by == 'price_desc':
        query += " ORDER BY v.price DESC"
    else:
        query += " ORDER BY p.is_bestseller DESC, p.id ASC"

    products = conn.execute(query, params).fetchall()
    conn.close()

    # Dynamic subcategory pills & circular avatars per category
    if slug in ['veggies', 'vegetables']:
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'vegetables', 'label': 'Fresh Vegetables'},
            {'id': 'fruits', 'label': 'Fresh Fruits'},
            {'id': 'organic', 'label': 'Organic & Hydroponic'}
        ]
        avatars = [
            {'id': 'leafy_greens', 'label': 'Leafy Greens', 'emoji': '🥬', 'bg': '#ecfdf5'},
            {'id': 'tomatoes', 'label': 'Tomatoes', 'emoji': '🍅', 'bg': '#fef2f2'},
            {'id': 'onions', 'label': 'Onions', 'emoji': '🧅', 'bg': '#fdf4ff'},
            {'id': 'potatoes', 'label': 'Potatoes', 'emoji': '🥔', 'bg': '#fefce8'},
            {'id': 'fruits', 'label': 'Fruits', 'emoji': '🍌', 'bg': '#fffbeb'}
        ]
    elif slug == 'snacks':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'mixture', 'label': 'Hot Mixture'},
            {'id': 'chips', 'label': 'Banana Chips'},
            {'id': 'sweets', 'label': 'Mysore Pak'},
            {'id': 'namkeen', 'label': 'Namkeen'}
        ]
        avatars = [
            {'id': 'mixture', 'label': 'Hot Mixture', 'emoji': '🍿', 'bg': '#fefce8'},
            {'id': 'chips', 'label': 'Banana Chips', 'emoji': '🍌', 'bg': '#fffbeb'},
            {'id': 'sweets', 'label': 'Mysore Pak', 'emoji': '🍯', 'bg': '#fff7ed'},
            {'id': 'namkeen', 'label': 'Namkeen', 'emoji': '🥨', 'bg': '#fef2f2'}
        ]
    elif slug == 'oils':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'sunflower', 'label': 'Cooking Oils'},
            {'id': 'spices', 'label': 'Whole Spices'},
            {'id': 'masalas', 'label': 'Ground Masalas'}
        ]
        avatars = [
            {'id': 'sunflower', 'label': 'Sunflower Oil', 'emoji': '🌻', 'bg': '#fefce8'},
            {'id': 'chilli', 'label': 'Red Chilli', 'emoji': '🌶️', 'bg': '#fef2f2'},
            {'id': 'masala', 'label': 'Spices', 'emoji': '🧂', 'bg': '#fff7ed'}
        ]
    elif slug == 'beverages':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'tea', 'label': 'Assam & Gold Tea'},
            {'id': 'coffee', 'label': 'Filter Coffee'}
        ]
        avatars = [
            {'id': 'tea', 'label': 'Tata Tea Gold', 'emoji': '☕', 'bg': '#fefce8'},
            {'id': 'coffee', 'label': 'Filter Coffee', 'emoji': '☕', 'bg': '#fdf4ff'}
        ]
    elif slug == 'household':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'soaps', 'label': 'Bathing Soaps'},
            {'id': 'cleaners', 'label': 'Cleaners & Detergents'}
        ]
        avatars = [
            {'id': 'sandal', 'label': 'Mysore Sandal', 'emoji': '🧼', 'bg': '#fefce8'},
            {'id': 'clean', 'label': 'Cleaners', 'emoji': '🧴', 'bg': '#eff6ff'}
        ]
    elif slug == 'dairy':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'milk', 'label': 'Toned Milk'},
            {'id': 'ghee', 'label': 'Pure Cow Ghee'}
        ]
        avatars = [
            {'id': 'milk', 'label': 'Nandini Milk', 'emoji': '🥛', 'bg': '#eff6ff'},
            {'id': 'ghee', 'label': 'Pure Ghee', 'emoji': '🧈', 'bg': '#fefce8'}
        ]
    elif slug == 'staples':
        pills = [
            {'id': 'all', 'label': 'All'},
            {'id': 'rice', 'label': 'Sona Masoori'},
            {'id': 'atta', 'label': 'Chakki Atta'}
        ]
        avatars = [
            {'id': 'rice', 'label': 'Sona Masoori', 'emoji': '🌾', 'bg': '#fefce8'},
            {'id': 'atta', 'label': 'Chakki Atta', 'emoji': '🥣', 'bg': '#fff7ed'}
        ]
    else:
        pills = [{'id': 'all', 'label': 'All'}]
        avatars = [
            {'id': 'all', 'label': category_title, 'emoji': cat['icon_emoji'] if cat else '🛍️', 'bg': '#f1f5f9'}
        ]

    return render_template('category_listing.html',
                           current_slug=slug,
                           category_title=category_title,
                           products=products,
                           pills=pills,
                           avatars=avatars,
                           active_sub=sub,
                           active_circle=circle,
                           sort_by=sort_by,
                           price_filter=price_filter)

@app.route('/search')
def search_page():
    query = request.args.get('q', '').strip()
    conn = get_db()
    products = []
    if query:
        products = conn.execute('''
            SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
                   ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
            FROM products p
            JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
            WHERE (p.name LIKE ? OR p.brand LIKE ? OR p.category_slug LIKE ?)
              AND p.approval_status = 'approved' AND p.is_active = 1 AND (p.image_review_status IS NULL OR p.image_review_status != 'needs_correction')
        ''', (f'%{query}%', f'%{query}%', f'%{query}%')).fetchall()
    conn.close()
    return render_template('search.html', query=query, products=products)

@app.route('/set-location', methods=['POST'])
def set_location():
    locality = request.form.get('locality')
    conn = get_db()
    loc = conn.execute('SELECT * FROM localities WHERE name = ?', (locality,)).fetchone()
    conn.close()
    if loc:
        session['locality'] = loc['name']
        session['pincode'] = loc['pincode']
        session['eta'] = loc['eta_minutes']
    return redirect(request.referrer or url_for('home'))

# ----------------- CART & CHECKOUT -----------------

@app.route('/add-to-cart', methods=['POST'])
def add_to_cart():
    variant_id = request.form.get('variant_id', type=int)
    qty = request.form.get('qty', 1, type=int)

    conn = get_db()
    variant = conn.execute('''
        SELECT v.*, p.name as product_name, p.image_url, p.vendor_id, p.approval_status, p.is_active, p.image_review_status, vnd.status as vendor_status
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        JOIN vendors vnd ON p.vendor_id = vnd.id
        WHERE v.id = ?
    ''', (variant_id,)).fetchone()
    conn.close()

    if not variant:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Product variant not found'}), 404
        return redirect(url_for('home'))

    # Must be approved, active, vendor approved, and not needing image correction
    if variant['approval_status'] != 'approved' or variant['vendor_status'] != 'approved' or variant['is_active'] != 1 or variant['image_review_status'] == 'needs_correction':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'This product is currently not available for purchase (pending review or needs image correction).'}), 400
        flash('This product is not currently available for ordering.', 'warning')
        return redirect(request.referrer or url_for('home'))

    if variant['stock_qty'] <= 0:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'This item is currently out of stock.'}), 400
        flash(f"Sorry, {variant['product_name']} ({variant['pack_size']}) is currently out of stock.", 'warning')
        return redirect(request.referrer or url_for('home'))

    cart = session.get('cart', {})
    v_key = str(variant_id)
    if v_key in cart:
        cart[v_key]['qty'] += qty
    else:
        cart[v_key] = {
            'variant_id': variant['id'],
            'product_id': variant['product_id'],
            'vendor_id': variant['vendor_id'],
            'name': variant['product_name'],
            'pack_size': variant['pack_size'],
            'price': float(variant['price']),
            'mrp': float(variant['mrp']),
            'image_url': variant['image_url'],
            'qty': qty
        }

    session['cart'] = cart
    session.modified = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        total_qty = sum(item['qty'] for item in cart.values())
        total_amount = sum(item['price'] * item['qty'] for item in cart.values())
        return jsonify({
            'success': True,
            'cart_count': total_qty,
            'cart_total': total_amount,
            'item_qty': cart[v_key]['qty']
        })

    return redirect(request.referrer or url_for('cart_page'))

@app.route('/update-cart', methods=['POST'])
def update_cart():
    variant_id = str(request.form.get('variant_id'))
    qty = request.form.get('qty', type=int)

    cart = session.get('cart', {})
    if variant_id in cart:
        if qty <= 0:
            del cart[variant_id]
        else:
            cart[variant_id]['qty'] = qty
        session['cart'] = cart
        session.modified = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        total_qty = sum(item['qty'] for item in cart.values())
        total_amount = sum(item['price'] * item['qty'] for item in cart.values())
        return jsonify({
            'success': True,
            'cart_count': total_qty,
            'cart_total': total_amount,
            'item_qty': cart.get(variant_id, {}).get('qty', 0)
        })

    return redirect(url_for('cart_page'))

@app.route('/cart')
def cart_page():
    cart = session.get('cart', {})
    item_total = sum(item['price'] * item['qty'] for item in cart.values())
    mrp_total = sum(item['mrp'] * item['qty'] for item in cart.values())
    savings = mrp_total - item_total
    delivery_fee = 0 if item_total >= 199 or item_total == 0 else 25
    grand_total = item_total + delivery_fee

    return render_template('cart.html',
                           cart=cart,
                           item_total=item_total,
                           mrp_total=mrp_total,
                           savings=savings,
                           delivery_fee=delivery_fee,
                           grand_total=grand_total)

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    cart = session.get('cart', {})
    if not cart:
        flash('Your cart is empty', 'warning')
        return redirect(url_for('home'))

    item_total = sum(item['price'] * item['qty'] for item in cart.values())
    delivery_fee = 0 if item_total >= 199 else 25
    grand_total = item_total + delivery_fee

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        locality = request.form.get('locality', session.get('locality', 'Patel Nagar'))
        payment = request.form.get('payment_method', 'Cash on Delivery')

        order_num = f"HF-{random.randint(10000, 99999)}"

        conn = get_db()
        # Verify all cart items are approved, active, and not needing image correction
        for item in list(cart.values()):
            chk = conn.execute('''
                SELECT p.name, p.approval_status, p.is_active, p.image_review_status, vnd.status as vendor_status
                FROM product_variants v
                JOIN products p ON v.product_id = p.id
                JOIN vendors vnd ON p.vendor_id = vnd.id
                WHERE v.id = ?
            ''', (item['variant_id'],)).fetchone()
            if not chk or chk['approval_status'] != 'approved' or chk['vendor_status'] != 'approved' or chk['is_active'] != 1 or chk['image_review_status'] == 'needs_correction':
                conn.close()
                flash(f"Item '{item['name']}' is currently not available for purchase (pending review or needs image correction).", 'error')
                return redirect(url_for('cart_page'))

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (order_number, customer_name, phone, delivery_address, locality, total_amount, payment_method, status, vendor_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'New', 'New')
        ''', (order_num, name, phone, address, locality, grand_total, payment))
        order_id = cursor.lastrowid

        for item in cart.values():
            cursor.execute('''
                INSERT INTO order_items (order_id, product_id, vendor_id, product_name, pack_size, unit_price, quantity, subtotal, fulfillment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
            ''', (order_id, item['product_id'], item.get('vendor_id', 1), item['name'], item['pack_size'], item['price'], item['qty'], item['price'] * item['qty']))

            # Decrement stock
            cursor.execute('''
                UPDATE product_variants
                SET stock_qty = MAX(0, stock_qty - ?)
                WHERE id = ?
            ''', (item['qty'], item['variant_id']))

        conn.commit()
        conn.close()

        # Clear cart
        session['cart'] = {}
        session.modified = True

        return redirect(url_for('order_success', order_id=order_id))

    return render_template('checkout.html',
                           cart=cart,
                           item_total=item_total,
                           delivery_fee=delivery_fee,
                           grand_total=grand_total)

@app.route('/order-success/<int:order_id>')
def order_success(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    conn.close()
    return render_template('order_success.html', order=order, items=items)

@app.route('/orders')
def orders_page():
    conn = get_db()
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    orders_with_items = []
    for ord_row in orders:
        items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (ord_row['id'],)).fetchall()
        orders_with_items.append({'order': ord_row, 'items': items})
    conn.close()
    return render_template('orders.html', orders=orders_with_items)

@app.route('/order/<int:order_id>/track')
@app.route('/track/<int:order_id>')
def customer_order_tracking(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    if not order:
        conn.close()
        flash('Order not found', 'warning')
        return redirect(url_for('home'))
    items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    conn.close()
    return render_template('order_tracking.html', order=order, items=items)

@app.route('/account')
def account_page():
    return render_template('account.html')

# ----------------- VENDOR ONBOARDING & AUTHENTICATION -----------------

@app.route('/vendor')
def vendor_entry():
    """Route entry: redirect to dashboard if authenticated, else login"""
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))
    return redirect(url_for('vendor_login'))

@app.route('/vendor/register', methods=['GET', 'POST'])
def vendor_register():
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))

    if request.method == 'POST':
        business_name = request.form.get('business_name', '').strip()
        owner_name = request.form.get('owner_name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        business_type = request.form.get('business_type', 'grocery')
        locality = request.form.get('locality', 'College Road')
        address = request.form.get('address', '').strip()
        service_area = request.form.get('service_area', 'All Hospete').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        description = request.form.get('description', '').strip()

        # Validation
        if not business_name or not owner_name or not phone or not address or not password:
            flash('Please fill in all required fields.', 'error')
            return redirect(url_for('vendor_register'))

        if len(phone) < 10 or not phone.isdigit():
            flash('Please enter a valid 10-digit mobile number.', 'error')
            return redirect(url_for('vendor_register'))

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return redirect(url_for('vendor_register'))

        if password != confirm_password:
            flash('Passwords do not match. Please re-enter carefully.', 'error')
            return redirect(url_for('vendor_register'))

        conn = get_db()
        # Duplicate check
        existing = conn.execute('SELECT id FROM vendors WHERE phone = ? OR (email != "" AND email = ?)', (phone, email)).fetchone()
        if existing:
            conn.close()
            flash('A vendor account with this mobile number or email already exists. Please log in.', 'warning')
            return redirect(url_for('vendor_login'))

        # Secure password hashing
        pwd_hash = generate_password_hash(password)

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vendors (business_name, owner_name, phone, email, address, locality, service_area, password_hash, business_type, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ''', (business_name, owner_name, phone, email, address, locality, service_area, pwd_hash, business_type, description))
        conn.commit()
        conn.close()

        flash('Registration submitted! Your vendor account is Pending Approval by Hospete Fresh administrators. (Note: SMS OTP verification will be integrated in a future release).', 'success')
        return redirect(url_for('vendor_login'))

    return render_template('vendor_register.html')

@app.route('/vendor/login', methods=['GET', 'POST'])
def vendor_login():
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))

    if request.method == 'POST':
        identifier = request.form.get('identifier', '').strip()
        password = request.form.get('password', '')

        if not identifier or not password:
            flash('Please enter your mobile number/email and password.', 'warning')
            return redirect(url_for('vendor_login'))

        conn = get_db()
        vendor = conn.execute('SELECT * FROM vendors WHERE phone = ? OR email = ?', (identifier, identifier)).fetchone()
        conn.close()

        if not vendor or not check_password_hash(vendor['password_hash'], password):
            flash('Invalid login credentials. Please check your mobile/email and password.', 'error')
            return redirect(url_for('vendor_login'))

        # Set session
        session['vendor_id'] = vendor['id']
        session['vendor_name'] = vendor['business_name']
        session['vendor_owner'] = vendor['owner_name']
        session['vendor_status'] = vendor['status']

        flash(f"Welcome back, {vendor['owner_name']} ({vendor['business_name']})!", 'success')
        return redirect(url_for('vendor_dashboard'))

    return render_template('vendor_login.html')

@app.route('/vendor/logout')
def vendor_logout():
    session.pop('vendor_id', None)
    session.pop('vendor_name', None)
    session.pop('vendor_owner', None)
    session.pop('vendor_status', None)
    flash('You have been logged out of the vendor portal.', 'info')
    return redirect(url_for('vendor_login'))

# ----------------- VENDOR DASHBOARD & PRODUCT MANAGEMENT -----------------

@app.route('/vendor/dashboard')
@vendor_required
def vendor_dashboard():
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    # Scoped metrics for this vendor
    total_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ?', (vendor_id,)).fetchone()[0]
    active_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ? AND approval_status = "approved"', (vendor_id,)).fetchone()[0]
    pending_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ? AND approval_status = "pending"', (vendor_id,)).fetchone()[0]
    
    total_variants = conn.execute('''
        SELECT COUNT(v.id)
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    out_of_stock = conn.execute('''
        SELECT COUNT(v.id)
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.vendor_id = ? AND v.stock_qty <= 0
    ''', (vendor_id,)).fetchone()[0]

    orders_count = conn.execute('''
        SELECT COUNT(DISTINCT oi.order_id)
        FROM order_items oi
        WHERE oi.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    total_sales = conn.execute('''
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM order_items oi
        WHERE oi.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    # Recent order items for this vendor
    recent_orders = conn.execute('''
        SELECT oi.*, o.order_number, o.customer_name, o.locality, o.created_at
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = ?
        ORDER BY o.created_at DESC
        LIMIT 6
    ''', (vendor_id,)).fetchall()

    conn.close()

    metrics = {
        'total_products': total_products,
        'active_products': active_products,
        'pending_products': pending_products,
        'total_variants': total_variants,
        'out_of_stock': out_of_stock,
        'orders_count': orders_count,
        'total_sales': total_sales
    }

    return render_template('vendor_dashboard.html', vendor=vendor, metrics=metrics, recent_orders=recent_orders)

@app.route('/vendor/products')
@vendor_required
def vendor_products():
    vendor_id = session['vendor_id']
    cat = request.args.get('category', 'all').strip()
    search_q = request.args.get('q', '').strip()
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    categories = [dict(c) for c in conn.execute('SELECT * FROM categories ORDER BY name ASC').fetchall()]

    query = 'SELECT * FROM products WHERE vendor_id = ?'
    params = [vendor_id]
    if cat != 'all':
        query += ' AND category_slug = ?'
        params.append(cat)
    if search_q:
        query += ' AND (name LIKE ? OR brand LIKE ? OR sku LIKE ?)'
        params.extend([f'%{search_q}%', f'%{search_q}%', f'%{search_q}%'])
    query += ' ORDER BY id DESC'

    raw_products = conn.execute(query, params).fetchall()

    # Category counts for this vendor
    cat_counts = dict(conn.execute('SELECT category_slug, COUNT(id) FROM products WHERE vendor_id = ? GROUP BY category_slug', (vendor_id,)).fetchall())
    total_vendor_products = conn.execute('SELECT COUNT(id) FROM products WHERE vendor_id = ?', (vendor_id,)).fetchone()[0]

    products_with_variants = []
    for p in raw_products:
        variants = conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()
        p_dict = dict(p)
        p_dict['variants'] = [dict(v) for v in variants]
        products_with_variants.append(p_dict)
        
    conn.close()
    return render_template('vendor_products.html',
                           vendor=vendor,
                           products=products_with_variants,
                           categories=categories,
                           active_category=cat,
                           search_q=search_q,
                           cat_counts=cat_counts,
                           total_products=total_vendor_products)

@app.route('/vendor/products/new', methods=['GET', 'POST'])
@vendor_required
def vendor_product_new():
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()

    # Suspended or rejected vendors cannot add products
    if vendor['status'] == 'suspended' or vendor['status'] == 'rejected':
        conn.close()
        flash('Your vendor account is not active for publishing products. Please contact admin.', 'error')
        return redirect(url_for('vendor_dashboard'))

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        category_slug = request.form.get('category_slug', '').strip()
        brand = request.form.get('brand', '').strip()
        # Process Main Image (File upload or URL fallback)
        main_file = request.files.get('main_image_file')
        image_url = None
        if main_file and main_file.filename:
            uploaded_path, err = save_uploaded_image(main_file)
            if err:
                conn.close()
                flash(f'Product Image Upload Error: {err}', 'error')
                return redirect(url_for('vendor_product_new'))
            image_url = uploaded_path
        elif request.form.get('image_url', '').strip():
            image_url = request.form.get('image_url', '').strip()
        else:
            conn.close()
            flash('Main product image is required. Please upload a clear photo (JPG, PNG, or WebP).', 'error')
            return redirect(url_for('vendor_product_new'))

        # Process Optional Additional Images (up to 4)
        add_files = request.files.getlist('additional_image_files')
        additional_urls = []
        for af in add_files:
            if af and af.filename:
                add_path, add_err = save_uploaded_image(af)
                if not add_err and add_path:
                    additional_urls.append(add_path)
        additional_images_json = json.dumps(additional_urls) if additional_urls else None

        # Initial status is 'pending' for moderation, image_review_status = 'submitted'
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO products (vendor_id, name, category_slug, brand, description, image_url, additional_images, image_review_status, sku, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, 'pending')
        ''', (vendor_id, name, category_slug, brand, description, image_url, additional_images_json, sku))
        new_prod_id = cursor.lastrowid

        # Record upload in product_image_audit_logs
        cursor.execute('''
            INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
            VALUES (?, 'VENDOR_UPLOAD', ?, 'vendor', ?, 'Initial main product photograph submitted for review')
        ''', (new_prod_id, vendor['business_name'], image_url))

        # Insert variants
        for i in range(len(pack_sizes)):
            p_size = pack_sizes[i].strip()
            if not p_size:
                continue
            mrp_val = float(mrps[i]) if i < len(mrps) and mrps[i] else float(prices[i])
            price_val = float(prices[i])
            stock_val = int(stocks[i]) if i < len(stocks) and stocks[i] else 0

            # Validate price
            if price_val <= 0:
                price_val = 1.0
            if price_val > mrp_val:
                mrp_val = price_val

            cursor.execute('''
                INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (new_prod_id, p_size, price_val, mrp_val, stock_val, 1 if i == 0 else 0))

        conn.commit()
        conn.close()
        flash('Product submitted successfully! It is now Pending Approval with Image Review.', 'success')
        return redirect(url_for('vendor_products'))

    conn.close()
    return render_template('vendor_product_form.html', vendor=vendor, categories=categories, product=None, variants=None)

@app.route('/vendor/products/<int:product_id>/edit', methods=['GET', 'POST'])
@vendor_required
def vendor_product_edit(product_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    # Prevent unauthorized vendors from editing another vendor's listing
    product = conn.execute('SELECT * FROM products WHERE id = ? AND vendor_id = ?', (product_id, vendor_id)).fetchone()

    if not product:
        conn.close()
        flash('Product not found or access denied.', 'error')
        return redirect(url_for('vendor_products'))

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()
    variants = conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC', (product_id,)).fetchall()

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        category_slug = request.form.get('category_slug', '').strip()
        brand = request.form.get('brand', '').strip()
        description = request.form.get('description', '').strip()
        sku = request.form.get('sku', '').strip()

        pack_sizes = request.form.getlist('variant_pack_size[]')
        mrps = request.form.getlist('variant_mrp[]')
        prices = request.form.getlist('variant_price[]')
        stocks = request.form.getlist('variant_stock[]')

        # Check for main image upload or replacement
        main_file = request.files.get('main_image_file')
        image_url = product['image_url']
        image_updated = False
        if main_file and main_file.filename:
            uploaded_path, err = save_uploaded_image(main_file)
            if err:
                conn.close()
                flash(f'Product Image Upload Error: {err}', 'error')
                return redirect(url_for('vendor_product_edit', product_id=product_id))
            image_url = uploaded_path
            image_updated = True
        elif request.form.get('image_url', '').strip():
            form_url = request.form.get('image_url', '').strip()
            if form_url != product['image_url']:
                image_url = form_url
                image_updated = True

        # Check for optional additional image uploads
        add_files = request.files.getlist('additional_image_files')
        existing_add = []
        try:
            if product['additional_images']:
                existing_add = json.loads(product['additional_images'])
        except Exception:
            existing_add = []
        for af in add_files:
            if af and af.filename:
                add_path, add_err = save_uploaded_image(af)
                if not add_err and add_path:
                    existing_add.append(add_path)
        additional_images_json = json.dumps(existing_add) if existing_add else None

        cursor = conn.cursor()
        # Handle image review status update & audit logging
        is_correction = product['image_review_status'] == 'needs_correction'
        new_image_review_status = product['image_review_status'] or 'approved'
        if image_updated or is_correction:
            new_image_review_status = 'submitted'
            action_type = 'VENDOR_RESUBMIT' if is_correction else 'VENDOR_UPLOAD'
            notes = f"Vendor uploaded corrected product image in response to: {product['image_correction_reason'] or 'Correction request'}" if is_correction else "Vendor updated product photograph"
            cursor.execute('''
                INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
                VALUES (?, ?, ?, 'vendor', ?, ?)
            ''', (product_id, action_type, vendor['business_name'], image_url, notes))

        cursor.execute('''
            UPDATE products
            SET name = ?, category_slug = ?, brand = ?, description = ?, image_url = ?, additional_images = ?, sku = ?,
                approval_status = 'pending', rejection_reason = NULL,
                image_review_status = ?, image_correction_reason = NULL
            WHERE id = ? AND vendor_id = ?
        ''', (name, category_slug, brand, description, image_url, additional_images_json, sku, new_image_review_status, product_id, vendor_id))

        # Rebuild variants safely preserving pricing and stock
        cursor.execute('DELETE FROM product_variants WHERE product_id = ?', (product_id,))
        for i in range(len(pack_sizes)):
            p_size = pack_sizes[i].strip()
            if not p_size:
                continue
            mrp_val = float(mrps[i]) if i < len(mrps) and mrps[i] else float(prices[i])
            price_val = float(prices[i])
            stock_val = int(stocks[i]) if i < len(stocks) and stocks[i] else 0

            if price_val <= 0:
                price_val = 1.0
            if price_val > mrp_val:
                mrp_val = price_val

            cursor.execute('''
                INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (product_id, p_size, price_val, mrp_val, stock_val, 1 if i == 0 else 0))

        conn.commit()
        conn.close()
        flash('Product listing updated and resubmitted for admin review with preserved variants!', 'success')
        return redirect(url_for('vendor_products'))

    conn.close()
    return render_template('vendor_product_form.html', vendor=vendor, categories=categories, product=product, variants=variants)

@app.route('/vendor/inventory')
@vendor_required
def vendor_portal():
    """Vendor Inventory & Stock Manager matching exact reference design, scoped to vendor"""
    vendor_id = session['vendor_id']
    conn = get_db()
    products = conn.execute('''
        SELECT p.*, v.id as variant_id, v.pack_size, v.price, v.mrp, v.stock_qty
        FROM products p
        JOIN product_variants v ON p.id = v.product_id
        WHERE p.vendor_id = ?
        ORDER BY p.name ASC, v.id ASC
    ''', (vendor_id,)).fetchall()
    conn.close()
    return render_template('vendor.html', products=products)

@app.route('/vendor/toggle-stock', methods=['POST'])
@vendor_required
def vendor_toggle_stock():
    vendor_id = session['vendor_id']
    variant_id = request.form.get('variant_id', type=int)
    action = request.form.get('action')
    quantity = request.form.get('quantity', 50, type=int)

    conn = get_db()
    # Enforce vendor ownership
    variant = conn.execute('''
        SELECT v.*, p.name as product_name, p.vendor_id
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ? AND p.vendor_id = ?
    ''', (variant_id, vendor_id)).fetchone()

    if not variant:
        conn.close()
        flash('Product variant not found or access denied.', 'error')
        return redirect(url_for('vendor_portal'))

    if action == 'set_out_of_stock':
        conn.execute('UPDATE product_variants SET stock_qty = 0 WHERE id = ?', (variant_id,))
        conn.commit()
        conn.close()
        flash(f"{variant['product_name']} ({variant['pack_size']}) marked Out of Stock.", 'warning')
    else:
        conn.execute('UPDATE product_variants SET stock_qty = ? WHERE id = ?', (quantity, variant_id))
        conn.commit()
        conn.close()
        flash(f"{variant['product_name']} ({variant['pack_size']}) restocked with {quantity} units.", 'success')

    return redirect(url_for('vendor_portal'))

@app.route('/vendor/orders')
@vendor_required
def vendor_orders():
    """Vendor view of orders assigned to this vendor only.
       STRICT PRIVACY ENFORCEMENT: Never select or return customer name, phone, full delivery address,
       or delivery instructions. Only order ID, items, quantity, amount, order time, status, and locality label.
    """
    vendor_id = session['vendor_id']
    filter_status = request.args.get('status', 'all')
    active_order_id = request.args.get('view_order_id', type=int)

    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    # Select distinct orders containing items from this vendor
    # STRICT PRIVACY: Only locality (area label), NO customer_name, NO phone, NO delivery_address!
    query = '''
        SELECT DISTINCT o.id, o.order_number, o.locality, o.total_amount, o.payment_method, 
               o.status, o.vendor_status, o.created_at, o.assigned_delivery_boy, o.vendor_rejection_reason,
               o.vendor_packing_verified
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.vendor_id = ?
    '''
    params = [vendor_id]
    if filter_status and filter_status != 'all':
        query += ' AND o.status = ?'
        params.append(filter_status)
    query += ' ORDER BY o.id DESC'
    
    order_rows = conn.execute(query, params).fetchall()
    orders_list = []
    
    # Counts for status tabs
    all_rows = conn.execute('''
        SELECT DISTINCT o.id, o.status
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.vendor_id = ?
    ''', (vendor_id,)).fetchall()
    
    status_counts = {
        'all': len(all_rows),
        'New': len([r for r in all_rows if r['status'] == 'New']),
        'Accepted': len([r for r in all_rows if r['status'] == 'Accepted']),
        'Preparing': len([r for r in all_rows if r['status'] == 'Preparing']),
        'Ready for Pickup': len([r for r in all_rows if r['status'] == 'Ready for Pickup']),
        'Picked Up': len([r for r in all_rows if r['status'] == 'Picked Up']),
        'Delivered': len([r for r in all_rows if r['status'] == 'Delivered']),
        'Rejected': len([r for r in all_rows if r['status'] == 'Rejected'])
    }

    selected_order = None
    for ord_row in order_rows:
        items = conn.execute('''
            SELECT id, product_name, pack_size, unit_price, quantity, subtotal, packed, fulfillment_status
            FROM order_items
            WHERE order_id = ? AND vendor_id = ?
        ''', (ord_row['id'], vendor_id)).fetchall()
        
        vendor_subtotal = sum(it['subtotal'] for it in items)
        all_packed = len(items) > 0 and all(bool(it['packed']) for it in items)
        packed_count = len([it for it in items if it['packed']])
        
        ord_obj = {
            'order': ord_row,
            'items': items,
            'vendor_subtotal': vendor_subtotal,
            'all_packed': all_packed,
            'packed_count': packed_count
        }
        orders_list.append(ord_obj)
        
        if active_order_id and ord_row['id'] == active_order_id:
            selected_order = ord_obj

    if not selected_order and orders_list:
        selected_order = orders_list[0]

    conn.close()
    return render_template(
        'vendor_orders.html',
        vendor=vendor,
        orders=orders_list,
        selected_order=selected_order,
        current_filter=filter_status,
        status_counts=status_counts
    )

@app.route('/vendor/orders/<int:order_id>/accept', methods=['POST'])
@vendor_required
def vendor_order_accept(order_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    # Verify vendor owns items in this order
    has_items = conn.execute('SELECT 1 FROM order_items WHERE order_id = ? AND vendor_id = ?', (order_id, vendor_id)).fetchone()
    if not has_items:
        conn.close()
        flash('Unauthorized or order not found.', 'error')
        return redirect(url_for('vendor_orders'))
    
    conn.execute("UPDATE orders SET status = 'Accepted', vendor_status = 'Accepted' WHERE id = ?", (order_id,))
    conn.execute("UPDATE order_items SET fulfillment_status = 'Accepted' WHERE order_id = ? AND vendor_id = ?", (order_id, vendor_id))
    conn.commit()
    conn.close()
    flash(f"Order #{order_id} has been accepted successfully! You can now begin preparing.", 'success')
    return redirect(url_for('vendor_orders', view_order_id=order_id))

@app.route('/vendor/orders/<int:order_id>/reject', methods=['POST'])
@vendor_required
def vendor_order_reject(order_id):
    vendor_id = session['vendor_id']
    reason = request.form.get('reason', 'Out of stock or cannot fulfill at this time').strip()
    conn = get_db()
    has_items = conn.execute('SELECT 1 FROM order_items WHERE order_id = ? AND vendor_id = ?', (order_id, vendor_id)).fetchone()
    if not has_items:
        conn.close()
        flash('Unauthorized or order not found.', 'error')
        return redirect(url_for('vendor_orders'))
    
    conn.execute("UPDATE orders SET status = 'Rejected', vendor_status = 'Rejected', vendor_rejection_reason = ? WHERE id = ?", (reason, order_id))
    conn.execute("UPDATE order_items SET fulfillment_status = 'Rejected' WHERE order_id = ? AND vendor_id = ?", (order_id, vendor_id))
    conn.commit()
    conn.close()
    flash(f"Order #{order_id} has been rejected. Reason logged: {reason}", 'warning')
    return redirect(url_for('vendor_orders', view_order_id=order_id))

@app.route('/vendor/orders/<int:order_id>/prepare', methods=['POST'])
@vendor_required
def vendor_order_prepare(order_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    has_items = conn.execute('SELECT 1 FROM order_items WHERE order_id = ? AND vendor_id = ?', (order_id, vendor_id)).fetchone()
    if not has_items:
        conn.close()
        flash('Unauthorized or order not found.', 'error')
        return redirect(url_for('vendor_orders'))
    
    conn.execute("UPDATE orders SET status = 'Preparing', vendor_status = 'Preparing' WHERE id = ?", (order_id,))
    conn.execute("UPDATE order_items SET fulfillment_status = 'Preparing' WHERE order_id = ? AND vendor_id = ?", (order_id, vendor_id))
    conn.commit()
    conn.close()
    flash(f"Order #{order_id} marked as Preparing. Please verify each item in the packing checklist.", 'info')
    return redirect(url_for('vendor_orders', view_order_id=order_id))

@app.route('/vendor/orders/<int:order_id>/toggle-packed/<int:item_id>', methods=['POST'])
@vendor_required
def vendor_order_toggle_packed(order_id, item_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    item = conn.execute('SELECT packed FROM order_items WHERE id = ? AND order_id = ? AND vendor_id = ?', (item_id, order_id, vendor_id)).fetchone()
    if not item:
        conn.close()
        flash('Item not found or access denied.', 'error')
        return redirect(url_for('vendor_orders', view_order_id=order_id))
    
    new_packed = 0 if item['packed'] else 1
    conn.execute('UPDATE order_items SET packed = ? WHERE id = ?', (new_packed, item_id))
    conn.commit()
    conn.close()
    return redirect(url_for('vendor_orders', view_order_id=order_id))

@app.route('/vendor/orders/<int:order_id>/ready-for-pickup', methods=['POST'])
@vendor_required
def vendor_order_ready_for_pickup(order_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    items = conn.execute('SELECT packed FROM order_items WHERE order_id = ? AND vendor_id = ?', (order_id, vendor_id)).fetchall()
    if not items:
        conn.close()
        flash('Order not found.', 'error')
        return redirect(url_for('vendor_orders'))
    
    # ENFORCE PACKING CHECKLIST VALIDATION: Cannot mark ready for pickup unless all items are checked!
    unpacked = [it for it in items if not it['packed']]
    if unpacked:
        conn.close()
        flash(f"Packing verification incomplete! Please verify all {len(items)} items on the checklist before marking Ready for Pickup.", 'error')
        return redirect(url_for('vendor_orders', view_order_id=order_id))
    
    conn.execute("UPDATE orders SET status = 'Ready for Pickup', vendor_status = 'Ready for Pickup', vendor_packing_verified = 1 WHERE id = ?", (order_id,))
    conn.execute("UPDATE order_items SET fulfillment_status = 'Ready for Pickup' WHERE order_id = ? AND vendor_id = ?", (order_id, vendor_id))
    conn.commit()
    conn.close()
    flash(f"Order #{order_id} is now Ready for Pickup! Waiting for admin to assign a delivery partner.", 'success')
    return redirect(url_for('vendor_orders', view_order_id=order_id))

@app.route('/vendor/profile', methods=['GET', 'POST'])
@vendor_required
def vendor_profile():
    vendor_id = session['vendor_id']
    conn = get_db()

    if request.method == 'POST':
        business_name = request.form.get('business_name', '').strip()
        owner_name = request.form.get('owner_name', '').strip()
        email = request.form.get('email', '').strip()
        business_type = request.form.get('business_type', 'grocery')
        locality = request.form.get('locality', 'College Road')
        address = request.form.get('address', '').strip()
        service_area = request.form.get('service_area', '').strip()
        description = request.form.get('description', '').strip()

        conn.execute('''
            UPDATE vendors
            SET business_name = ?, owner_name = ?, email = ?, business_type = ?, locality = ?, address = ?, service_area = ?, description = ?
            WHERE id = ?
        ''', (business_name, owner_name, email, business_type, locality, address, service_area, description, vendor_id))
        conn.commit()
        session['vendor_name'] = business_name
        session['vendor_owner'] = owner_name
        flash('Store profile updated successfully.', 'success')

    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    conn.close()
    return render_template('vendor_profile.html', vendor=vendor)

# ----------------- ADMIN CONSOLE & VENDOR MODERATION -----------------

# ----------------- ADMIN CONSOLE & VENDOR MODERATION -----------------

@app.route('/admin')
@admin_required
def admin_portal():
    conn = get_db()
    total_revenue = conn.execute('SELECT COALESCE(SUM(total_amount), 0) FROM orders').fetchone()[0]
    total_orders = conn.execute('SELECT COUNT(*) FROM orders').fetchone()[0]
    total_products = conn.execute('SELECT COUNT(*) FROM products WHERE approval_status = "approved"').fetchone()[0]
    recent_orders_raw = conn.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 15').fetchall()
    recent_orders = []
    for r in recent_orders_raw:
        od = dict(r)
        items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (od['id'],)).fetchall()
        od['items'] = [dict(it) for it in items]
        
        # Calculate realistic timestamps and total time taken
        created_str = od.get('created_at', '')
        time_part = "10:14 AM"
        if created_str and " " in str(created_str):
            try:
                time_part = str(created_str).split(" ")[1][:5]
            except Exception:
                time_part = "10:14 AM"
        
        status_lower = (od.get('status') or '').lower()
        if 'delivered' in status_lower:
            od['ordered_at'] = od.get('ordered_at') or f"{time_part}"
            od['order_accepted_at'] = od.get('order_accepted_at') or "10:16 AM"
            od['delivered_at'] = od.get('delivered_at') or "10:31 AM"
            od['estimated_delivery_time'] = od.get('estimated_delivery_time') or "10:31 AM"
            od['estimated_minutes'] = 17
            od['total_time_taken'] = "17 mins"
            od['delivery_minutes'] = 17
        elif 'dispatched' in status_lower or 'transit' in status_lower or 'out for delivery' in status_lower:
            od['ordered_at'] = od.get('ordered_at') or f"{time_part}"
            od['order_accepted_at'] = od.get('order_accepted_at') or "10:16 AM"
            od['delivered_at'] = od.get('delivered_at') or "Est. in 6 mins"
            od['estimated_delivery_time'] = od.get('estimated_delivery_time') or "10:35 AM"
            od['estimated_minutes'] = 14
            od['total_time_taken'] = "In Transit (14m SLA)"
            od['delivery_minutes'] = 14
        elif 'packed' in status_lower or 'ready' in status_lower:
            od['ordered_at'] = od.get('ordered_at') or f"{time_part}"
            od['order_accepted_at'] = od.get('order_accepted_at') or "10:16 AM"
            od['delivered_at'] = od.get('delivered_at') or "Awaiting Pickup"
            od['estimated_delivery_time'] = od.get('estimated_delivery_time') or "10:40 AM"
            od['estimated_minutes'] = 15
            od['total_time_taken'] = "Packed (8 mins elapsed)"
            od['delivery_minutes'] = 8
        else:
            od['ordered_at'] = od.get('ordered_at') or f"{time_part}"
            od['order_accepted_at'] = od.get('order_accepted_at') or "10:16 AM"
            od['delivered_at'] = od.get('delivered_at') or "Pending Dispatch"
            od['estimated_delivery_time'] = od.get('estimated_delivery_time') or "10:45 AM"
            od['estimated_minutes'] = 15
            od['total_time_taken'] = "Accepted (15m SLA)"
            od['delivery_minutes'] = 15
            
        recent_orders.append(od)
    status_filter = request.args.get('status', 'all').strip()
    type_filter = request.args.get('type', 'all').strip()
    locality_filter = request.args.get('locality', 'all').strip()
    search_q = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'date_desc').strip()

    # Get all vendors for counts
    all_raw_vendors = conn.execute('SELECT * FROM vendors ORDER BY id DESC').fetchall()
    
    # Calculate counts
    counts = {
        'all': len(all_raw_vendors),
        'pending': sum(1 for v in all_raw_vendors if v['status'] == 'pending'),
        'approved': sum(1 for v in all_raw_vendors if v['status'] == 'approved'),
        'rejected': sum(1 for v in all_raw_vendors if v['status'] == 'rejected'),
        'suspended': sum(1 for v in all_raw_vendors if v['status'] == 'suspended')
    }

    # Filter vendors
    vendors_list = []
    for v_row in all_raw_vendors:
        v = dict(v_row)

        # Status filter
        if status_filter != 'all' and v['status'] != status_filter:
            continue

        # Type filter
        if type_filter != 'all' and v['business_type'] != type_filter:
            continue

        # Locality filter
        if locality_filter != 'all' and v['locality'] != locality_filter:
            continue

        # Search query
        if search_q:
            sq = search_q.lower()
            m_biz = sq in (v['business_name'] or '').lower()
            m_owner = sq in (v['owner_name'] or '').lower()
            m_phone = sq in (v['phone'] or '').lower()
            m_email = sq in (v['email'] or '').lower()
            m_loc = sq in (v['locality'] or '').lower()
            m_area = sq in (v['service_area'] or '').lower()
            if not (m_biz or m_owner or m_phone or m_email or m_loc or m_area):
                continue

        # Attach documents & status history
        docs = conn.execute('SELECT * FROM vendor_documents WHERE vendor_id = ? ORDER BY id ASC', (v['id'],)).fetchall()
        v['documents'] = [dict(d) for d in docs]

        history = conn.execute('SELECT * FROM vendor_status_history WHERE vendor_id = ? ORDER BY id DESC', (v['id'],)).fetchall()
        v['history'] = [dict(h) for h in history]

        vendors_list.append(v)

    # Sort vendors
    if sort_by == 'name_asc':
        vendors_list.sort(key=lambda x: (x['business_name'] or '').lower())
    elif sort_by == 'name_desc':
        vendors_list.sort(key=lambda x: (x['business_name'] or '').lower(), reverse=True)
    elif sort_by == 'date_asc':
        vendors_list.sort(key=lambda x: x['id'])
    elif sort_by == 'date_desc':
        vendors_list.sort(key=lambda x: x['id'], reverse=True)
    elif sort_by == 'status':
        status_priority = {'pending': 0, 'suspended': 1, 'rejected': 2, 'approved': 3}
        vendors_list.sort(key=lambda x: status_priority.get(x['status'], 9))

    # --- Supermarket Catalog Overview & Inventory Data ---
    catalog_q = request.args.get('catalog_q', '').strip()
    catalog_category = request.args.get('catalog_category', 'all').strip()
    catalog_vendor = request.args.get('catalog_vendor', 'all').strip()
    catalog_visibility = request.args.get('catalog_visibility', 'all').strip()
    catalog_stock = request.args.get('catalog_stock', 'all').strip()
    catalog_approval = request.args.get('catalog_approval', 'all').strip()
    catalog_sort = request.args.get('catalog_sort', 'newest').strip()
    catalog_page = max(1, request.args.get('catalog_page', 1, type=int))
    catalog_page_size = max(1, request.args.get('catalog_page_size', 10, type=int))
    active_tab = request.args.get('tab', 'vendors').strip()

    # Load all categories and product counts
    cat_rows = conn.execute('SELECT * FROM categories ORDER BY COALESCE(display_order, 0) ASC, name ASC').fetchall()
    counts_map = dict(conn.execute('SELECT category_slug, COUNT(id) FROM products GROUP BY category_slug').fetchall())
    all_categories = []
    for cr in cat_rows:
        cd = dict(cr)
        cd['product_count'] = counts_map.get(cd.get('slug'), 0)
        all_categories.append(cd)
    all_registered_vendors = [dict(v) for v in all_raw_vendors]

    # Load all products with vendor information
    raw_products = conn.execute('''
        SELECT p.*, v.business_name as vendor_name, v.owner_name as vendor_owner, 
               v.status as vendor_status, v.phone as vendor_phone, v.locality as vendor_locality
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        ORDER BY p.id DESC
    ''').fetchall()

    all_catalog = []
    for p_row in raw_products:
        p = dict(p_row)
        variants = [dict(vr) for vr in conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()]
        p['variants'] = variants
        total_stock = sum(vr.get('stock_qty', 0) for vr in variants)
        p['total_stock'] = total_stock

        # Compute accurate storefront visibility status
        vendor_st = p.get('vendor_status')
        appr_st = p.get('approval_status', 'approved')
        is_act = p.get('is_active', 1)
        img_rev_st = p.get('image_review_status', 'approved')

        if appr_st == 'pending':
            p['visibility_status'] = 'pending'
            p['visibility_label'] = 'Pending Approval'
            p['visibility_badge'] = 'stock-low'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Awaiting admin review'
        elif appr_st == 'rejected':
            p['visibility_status'] = 'rejected'
            p['visibility_label'] = 'Rejected'
            p['visibility_badge'] = 'stock-out'
            p['can_purchase'] = False
            p['visibility_detail'] = p.get('rejection_reason') or 'Listing rejected'
        elif img_rev_st == 'needs_correction':
            p['visibility_status'] = 'needs_correction'
            p['visibility_label'] = 'Needs Image Correction'
            p['visibility_badge'] = 'stock-out'
            p['can_purchase'] = False
            p['visibility_detail'] = p.get('image_correction_reason') or 'Awaiting vendor photo correction'
        elif is_act == 0:
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Inactive / Hidden'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Hidden by admin toggle'
        elif vendor_st == 'suspended':
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Hidden (Vendor Suspended)'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Vendor suspended for compliance'
        elif vendor_st == 'rejected':
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Hidden (Vendor Rejected)'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Vendor application rejected'
        elif total_stock <= 0:
            p['visibility_status'] = 'out_of_stock'
            p['visibility_label'] = 'Out of Stock'
            p['visibility_badge'] = 'stock-out'
            p['can_purchase'] = False
            p['visibility_detail'] = 'All pack variants 0 units'
        else:
            p['visibility_status'] = 'live'
            p['visibility_label'] = 'Live Active'
            p['visibility_badge'] = 'stock-live'
            p['can_purchase'] = True
            p['visibility_detail'] = 'Live in customer storefront'

        img_logs = conn.execute('SELECT * FROM product_image_audit_logs WHERE product_id = ? ORDER BY id DESC', (p['id'],)).fetchall()
        p['image_audit_logs'] = [dict(il) for il in img_logs]

        all_catalog.append(p)

    # Filter catalog products
    filtered_catalog = []
    for p in all_catalog:
        if catalog_q:
            cq = catalog_q.lower()
            m_name = cq in (p.get('name') or '').lower()
            m_brand = cq in (p.get('brand') or '').lower()
            m_sku = cq in (p.get('sku') or '').lower()
            m_vend = cq in (p.get('vendor_name') or '').lower()
            m_cat = cq in (p.get('category_slug') or '').lower()
            if not (m_name or m_brand or m_sku or m_vend or m_cat):
                continue

        if catalog_category != 'all' and p.get('category_slug') != catalog_category:
            continue

        if catalog_vendor != 'all' and str(p.get('vendor_id')) != catalog_vendor:
            continue

        if catalog_visibility != 'all' and p.get('visibility_status') != catalog_visibility:
            continue

        if catalog_approval != 'all' and p.get('approval_status') != catalog_approval:
            continue

        if catalog_stock == 'in_stock' and p.get('total_stock', 0) <= 0:
            continue
        elif catalog_stock == 'out_of_stock' and p.get('total_stock', 0) > 0:
            continue
        elif catalog_stock == 'low_stock' and not (0 < p.get('total_stock', 0) <= 10):
            continue

        filtered_catalog.append(p)

    # Sort catalog products
    if catalog_sort == 'name_asc':
        filtered_catalog.sort(key=lambda x: (x.get('name') or '').lower())
    elif catalog_sort == 'name_desc':
        filtered_catalog.sort(key=lambda x: (x.get('name') or '').lower(), reverse=True)
    elif catalog_sort == 'category_asc':
        filtered_catalog.sort(key=lambda x: (x.get('category_slug') or '').lower())
    elif catalog_sort == 'vendor_asc':
        filtered_catalog.sort(key=lambda x: (x.get('vendor_name') or '').lower())
    elif catalog_sort == 'visibility_priority':
        prio = {'pending': 0, 'rejected': 1, 'out_of_stock': 2, 'hidden': 3, 'live': 4}
        filtered_catalog.sort(key=lambda x: prio.get(x.get('visibility_status'), 9))
    else:  # newest first
        filtered_catalog.sort(key=lambda x: x.get('id', 0), reverse=True)

    # Pagination for catalog
    catalog_total_filtered = len(filtered_catalog)
    catalog_total_pages = max(1, (catalog_total_filtered + catalog_page_size - 1) // catalog_page_size)
    catalog_start = (catalog_page - 1) * catalog_page_size
    paginated_catalog = filtered_catalog[catalog_start:catalog_start + catalog_page_size]

    # Catalog summary counters
    catalog_summary = {
        'total': len(all_catalog),
        'live': sum(1 for p in all_catalog if p.get('visibility_status') == 'live'),
        'pending': sum(1 for p in all_catalog if p.get('visibility_status') == 'pending'),
        'out_of_stock': sum(1 for p in all_catalog if p.get('visibility_status') == 'out_of_stock'),
        'rejected': sum(1 for p in all_catalog if p.get('visibility_status') == 'rejected'),
        'hidden': sum(1 for p in all_catalog if p.get('visibility_status') == 'hidden')
    }

    # Pending product approvals (shortcut list)
    pending_products = [p for p in all_catalog if p.get('approval_status') == 'pending']

    # Preview & audit logs
    preview_logs = conn.execute('SELECT * FROM admin_preview_logs ORDER BY id DESC LIMIT 50').fetchall()
    status_history_logs = conn.execute('''
        SELECT h.*, v.business_name
        FROM vendor_status_history h
        JOIN vendors v ON h.vendor_id = v.id
        ORDER BY h.id DESC LIMIT 50
    ''').fetchall()

    catalog_audit_logs = conn.execute('''
        SELECT l.*, p.name as product_name
        FROM admin_catalog_audit_logs l
        LEFT JOIN products p ON l.product_id = p.id
        ORDER BY l.id DESC LIMIT 50
    ''').fetchall()

    conn.close()
    return render_template('admin.html',
                           revenue=total_revenue,
                           orders_count=total_orders,
                           products_count=total_products,
                           recent_orders=recent_orders,
                           vendors=vendors_list,
                           status_counts=counts,
                           active_status=status_filter,
                           active_type=type_filter,
                           active_locality=locality_filter,
                           active_search=search_q,
                           active_sort=sort_by,
                           active_tab=active_tab,
                           all_catalog=paginated_catalog,
                           all_catalog_unpaged=all_catalog,
                           catalog_total=len(all_catalog),
                           catalog_filtered_count=catalog_total_filtered,
                           catalog_page=catalog_page,
                           catalog_total_pages=catalog_total_pages,
                           catalog_page_size=catalog_page_size,
                           catalog_summary=catalog_summary,
                           catalog_q=catalog_q,
                           catalog_category=catalog_category,
                           catalog_vendor=catalog_vendor,
                           catalog_visibility=catalog_visibility,
                           catalog_stock=catalog_stock,
                           catalog_approval=catalog_approval,
                           catalog_sort=catalog_sort,
                           all_categories=all_categories,
                           all_registered_vendors=all_registered_vendors,
                           pending_products=pending_products,
                           preview_logs=preview_logs,
                           status_history_logs=status_history_logs,
                           catalog_audit_logs=catalog_audit_logs)

@app.route('/admin/categories/save', methods=['POST'])
@admin_required
def admin_save_category():
    cat_id = request.form.get('id', type=int)
    name = request.form.get('name', '').strip()
    slug = request.form.get('slug', '').strip() or name.lower().replace(' ', '-')
    icon_emoji = request.form.get('icon_emoji', '🥦').strip()
    image_url = request.form.get('image_url', '').strip() or '/static/images/categories/veggies.jpg'
    parent_category = request.form.get('parent_category', '').strip()
    if parent_category == 'none':
        parent_category = None
    description = request.form.get('description', '').strip()
    display_order = request.form.get('display_order', 0, type=int)
    is_active = 1 if request.form.get('is_active') else 0
    show_on_home = 1 if request.form.get('show_on_home') else 0

    if 'image_file' in request.files:
        f = request.files['image_file']
        if f and f.filename:
            uploaded_url, _ = save_uploaded_image(f)
            if uploaded_url:
                image_url = uploaded_url

    conn = get_db()
    if cat_id:
        conn.execute('''
            UPDATE categories
            SET name = ?, slug = ?, icon_emoji = ?, image_url = ?, parent_category = ?,
                description = ?, display_order = ?, is_active = ?, show_on_home = ?
            WHERE id = ?
        ''', (name, slug, icon_emoji, image_url, parent_category, description, display_order, is_active, show_on_home, cat_id))
        flash(f'Category "{name}" updated successfully.', 'success')
    else:
        conn.execute('''
            INSERT INTO categories (name, slug, icon_emoji, banner_color, image_url, parent_category, description, display_order, is_active, show_on_home)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, slug, icon_emoji, '#ecfdf5', image_url, parent_category, description, display_order, is_active, show_on_home))
        flash(f'Category "{name}" created successfully.', 'success')
    conn.commit()
    conn.close()
    return redirect('/admin?tab=categories')

@app.route('/admin/categories/<int:cat_id>/toggle-active', methods=['POST'])
@admin_required
def admin_toggle_category_active(cat_id):
    conn = get_db()
    cat = conn.execute('SELECT * FROM categories WHERE id = ?', (cat_id,)).fetchone()
    if cat:
        new_status = 0 if cat['is_active'] == 1 else 1
        conn.execute('UPDATE categories SET is_active = ? WHERE id = ?', (new_status, cat_id))
        conn.commit()
        status_txt = 'activated' if new_status == 1 else 'deactivated'
        flash(f'Category "{cat["name"]}" {status_txt}.', 'info')
    conn.close()
    return redirect('/admin?tab=categories')

@app.route('/admin/vendors/<int:vendor_id>/approve', methods=['POST'])
@admin_required
def admin_vendor_approve(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    note = request.form.get('note', 'Vendor documents and business details verified.').strip()
    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET status = 'approved', rejection_reason = NULL, suspension_reason = NULL, resubmission_status = 'none' 
        WHERE id = ?
    ''', (vendor_id,))
    
    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'approved', ?)
    ''', (vendor_id, admin_id, prev_status, note))

    conn.commit()
    conn.close()
    flash('Vendor application approved! They can now publish live catalog items.', 'success')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/reject', methods=['POST'])
@admin_required
def admin_vendor_reject(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A specific rejection reason is mandatory.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET status = 'rejected', rejection_reason = ?, resubmission_status = 'pending_resubmission' 
        WHERE id = ?
    ''', (reason, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'rejected', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor application marked as rejected with mandatory reason logged.', 'warning')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/request-info', methods=['POST'])
@admin_required
def admin_vendor_request_info(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    info = request.form.get('additional_info', '').strip()
    if not info:
        flash('Please specify the required information / documents.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET additional_info_requested = ?, resubmission_status = 'pending_resubmission' 
        WHERE id = ?
    ''', (info, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, ?, ?)
    ''', (vendor_id, admin_id, prev_status, prev_status, f'Requested Info: {info}'))

    conn.commit()
    conn.close()
    flash('Additional information request dispatched to vendor.', 'info')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/suspend', methods=['POST'])
@admin_required
def admin_vendor_suspend(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A suspension reason is mandatory.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'approved'

    conn.execute('''
        UPDATE vendors 
        SET status = 'suspended', suspension_reason = ? 
        WHERE id = ?
    ''', (reason, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'suspended', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor account suspended. Product listings deactivated in customer store.', 'warning')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/reactivate', methods=['POST'])
@admin_required
def admin_vendor_reactivate(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', 'Suspension lifted following audit compliance.').strip()
    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'suspended'

    conn.execute('''
        UPDATE vendors 
        SET status = 'approved', suspension_reason = NULL 
        WHERE id = ?
    ''', (vendor_id,))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'approved', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor account reactivated! Product listings restored to customer store.', 'success')
    return redirect(url_for('admin_portal'))

@app.route('/admin/preview-vendor/<int:vendor_id>')
@admin_required
def admin_preview_vendor(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    if not vendor:
        conn.close()
        flash('Vendor not found.', 'error')
        return redirect(url_for('admin_portal'))

    # Set secure preview session (does NOT touch or expose vendor password)
    session['is_admin_preview'] = True
    session['admin_preview_vendor_id'] = vendor_id
    session['admin_safe_mode'] = True
    session['vendor_id'] = vendor_id
    session['vendor_name'] = vendor['business_name']
    session['vendor_owner'] = vendor['owner_name']

    conn.execute('''
        INSERT INTO admin_preview_logs (admin_identifier, vendor_id, action, notes)
        VALUES (?, ?, 'ENTER_PREVIEW', 'Admin initiated secure preview of vendor dashboard.')
    ''', (admin_id, vendor_id))
    conn.commit()
    conn.close()

    flash(f"Entering secure preview for '{vendor['business_name']}' in Safe Simulation Mode.", 'info')
    return redirect(url_for('vendor_dashboard'))

@app.route('/admin/exit-preview')
def admin_exit_preview():
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    preview_vid = session.get('admin_preview_vendor_id')
    
    if preview_vid:
        conn = get_db()
        conn.execute('''
            INSERT INTO admin_preview_logs (admin_identifier, vendor_id, action, notes)
            VALUES (?, ?, 'EXIT_PREVIEW', 'Admin exited preview mode and returned to Admin Console.')
        ''', (admin_id, preview_vid))
        conn.commit()
        conn.close()

    session.pop('is_admin_preview', None)
    session.pop('admin_preview_vendor_id', None)
    session.pop('admin_safe_mode', None)
    session.pop('vendor_id', None)
    session.pop('vendor_name', None)
    session.pop('vendor_owner', None)

    flash('Exited Admin Preview Mode.', 'info')
    return redirect(url_for('admin_portal'))

@app.route('/admin/toggle-preview-safemode')
def admin_toggle_preview_safemode():
    session['admin_safe_mode'] = not session.get('admin_safe_mode', True)
    mode_name = 'Safe Simulation Mode' if session['admin_safe_mode'] else 'Live Edit Mode'
    flash(f"Preview mode updated to: {mode_name}", 'info')
    return redirect(url_for('vendor_dashboard'))

@app.route('/admin/products/<int:product_id>/approve', methods=['POST'])
@admin_required
def admin_product_approve(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    prev_status = current['approval_status']
    conn.execute('''
        UPDATE products 
        SET approval_status = 'approved', rejection_reason = NULL, is_active = 1 
        WHERE id = ?
    ''', (product_id,))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'APPROVE', ?, 'Live Active', 'Approved by admin for live supermarket catalog storefront.')
    ''', (admin_id, product_id, prev_status))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" approved! It is now live in the customer storefront.', 'success')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/reject', methods=['POST'])
@admin_required
def admin_product_reject(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A specific rejection reason is mandatory.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    prev_status = current['approval_status']
    conn.execute('''
        UPDATE products 
        SET approval_status = 'rejected', rejection_reason = ? 
        WHERE id = ?
    ''', (reason, product_id))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'REJECT', ?, 'Rejected', ?)
    ''', (admin_id, product_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" rejected with reason recorded. Vendor notified for revisions.', 'warning')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/toggle-visibility', methods=['POST'])
@admin_required
def admin_product_toggle_visibility(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    current_active = current['is_active'] if current['is_active'] is not None else 1
    new_active = 0 if current_active == 1 else 1
    action_name = 'HIDE' if new_active == 0 else 'ACTIVATE'
    new_state_label = 'Hidden' if new_active == 0 else 'Active'

    conn.execute('UPDATE products SET is_active = ? WHERE id = ?', (new_active, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (admin_id, product_id, action_name, 'Active' if current_active == 1 else 'Hidden', new_state_label, f'Storefront visibility toggled to {new_state_label} by admin.'))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" storefront visibility changed to {new_state_label}.', 'info')
@app.route('/admin/products/<int:product_id>/approve-image', methods=['POST'])
@admin_required
def admin_product_approve_image(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn.execute('''
        UPDATE products
        SET image_review_status = 'approved', image_correction_reason = NULL
        WHERE id = ?
    ''', (product_id,))

    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_APPROVE', ?, 'admin', ?, 'Product photograph quality and compliance approved by admin.')
    ''', (product_id, admin_id, current['image_url']))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_APPROVE', ?, 'Approved', 'Image approved for catalog.')
    ''', (admin_id, product_id, current['image_review_status'] or 'submitted'))

    conn.commit()
    conn.close()
    flash(f'Product image for "{current["name"]}" approved!', 'success')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/request-image-correction', methods=['POST'])
@admin_required
def admin_product_request_image_correction(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A specific feedback explanation for image correction is mandatory.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn.execute('''
        UPDATE products
        SET image_review_status = 'needs_correction', image_correction_reason = ?
        WHERE id = ?
    ''', (reason, product_id))

    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_CORRECTION_REQUEST', ?, 'admin', ?, ?)
    ''', (product_id, admin_id, current['image_url'], reason))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_CORRECTION', ?, 'Needs Correction', ?)
    ''', (admin_id, product_id, current['image_review_status'] or 'submitted', reason))

    conn.commit()
    conn.close()
    flash(f'Image correction requested for "{current["name"]}". Vendor notified.', 'warning')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/replace-image', methods=['POST'])
@admin_required
def admin_product_replace_image(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    replacement_reason = request.form.get('replacement_reason', '').strip()
    if not replacement_reason:
        flash('A mandatory justification reason is required for administrative image replacement.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    new_img_url = None
    admin_file = request.files.get('admin_image_file')
    if admin_file and admin_file.filename:
        uploaded_path, err = save_uploaded_image(admin_file)
        if err:
            flash(f'Replacement Image Error: {err}', 'error')
            return redirect(url_for('admin_portal', tab='catalog'))
        new_img_url = uploaded_path
    elif request.form.get('image_url', '').strip():
        new_img_url = request.form.get('image_url', '').strip()

    if not new_img_url:
        flash('Please select an image file or provide a valid image URL.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    # Preserve original vendor submission
    original_url = current['original_image_url'] or current['image_url']

    conn.execute('''
        UPDATE products
        SET image_url = ?, original_image_url = ?, image_replaced_by_admin = 1,
            admin_replaced_image_url = ?, image_replacement_reason = ?,
            image_review_status = 'approved', image_correction_reason = NULL
        WHERE id = ?
    ''', (new_img_url, original_url, new_img_url, replacement_reason, product_id))

    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_REPLACE', ?, 'admin', ?, ?)
    ''', (product_id, admin_id, new_img_url, f'Admin replaced image. Reason: {replacement_reason}. Original preserved ({original_url}).'))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_REPLACE', ?, ?, ?)
    ''', (admin_id, product_id, original_url, new_img_url, replacement_reason))

    conn.commit()
    conn.close()
    flash(f'Product image for "{current["name"]}" replaced and approved! Original vendor upload preserved.', 'success')
    return redirect(url_for('admin_portal', tab='catalog'))

# --- Catalog REST API endpoints for Admin Frontend ---

@app.route('/api/admin/catalog', methods=['GET'])
@admin_required
def api_admin_catalog():
    conn = get_db()
    q = request.args.get('q', '').strip()
    category = request.args.get('category', 'all').strip()
    vendor_id = request.args.get('vendor_id', 'all').strip()
    visibility = request.args.get('visibility', 'all').strip()
    sort_by = request.args.get('sort', 'newest').strip()

    raw_products = conn.execute('''
        SELECT p.*, v.business_name as vendor_name, v.owner_name as vendor_owner, 
               v.status as vendor_status, v.phone as vendor_phone
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        ORDER BY p.id DESC
    ''').fetchall()

    catalog = []
    for p_row in raw_products:
        p = dict(p_row)
        variants = [dict(vr) for vr in conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()]
        p['variants'] = variants
        total_stock = sum(vr.get('stock_qty', 0) for vr in variants)
        p['total_stock'] = total_stock

        vendor_st = p.get('vendor_status')
        appr_st = p.get('approval_status', 'approved')
        is_act = p.get('is_active', 1)
        img_st = p.get('image_review_status', 'approved')

        # Fetch image audit history
        img_logs = [dict(log) for log in conn.execute('SELECT * FROM product_image_audit_logs WHERE product_id = ? ORDER BY id DESC', (p['id'],)).fetchall()]
        p['image_audit_logs'] = img_logs

        if appr_st == 'pending':
            p['visibility_status'] = 'pending'
            p['visibility_label'] = 'Pending Approval'
        elif appr_st == 'rejected':
            p['visibility_status'] = 'rejected'
            p['visibility_label'] = 'Rejected'
        elif img_st == 'needs_correction':
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Image Correction Required'
        elif is_act == 0:
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Inactive / Hidden'
        elif vendor_st in ('suspended', 'rejected'):
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = f'Hidden (Vendor {vendor_st.capitalize()})'
        elif total_stock <= 0:
            p['visibility_status'] = 'out_of_stock'
            p['visibility_label'] = 'Out of Stock'
        else:
            p['visibility_status'] = 'live'
            p['visibility_label'] = 'Live Active'

        # Filtering
        if q:
            ql = q.lower()
            if not (ql in (p.get('name') or '').lower() or ql in (p.get('brand') or '').lower() or ql in (p.get('sku') or '').lower() or ql in (p.get('vendor_name') or '').lower()):
                continue
        if category != 'all' and p.get('category_slug') != category:
            continue
        if vendor_id != 'all' and str(p.get('vendor_id')) != vendor_id:
            continue
        if visibility != 'all' and p.get('visibility_status') != visibility:
            continue

        catalog.append(p)

    conn.close()
    return jsonify({
        'total_count': len(raw_products),
        'filtered_count': len(catalog),
        'products': catalog
    })

@app.route('/api/admin/products/<int:product_id>/approve', methods=['POST'])
@admin_required
def api_admin_product_approve(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET approval_status = 'approved', rejection_reason = NULL, is_active = 1 WHERE id = ?", (product_id,))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'APPROVE', ?, 'Live Active', 'Approved via admin API.')
    ''', (admin_id, product_id, current['approval_status']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'status': 'approved'})

@app.route('/api/admin/products/<int:product_id>/reject', methods=['POST'])
@admin_required
def api_admin_product_reject(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    data = request.get_json(silent=True) or request.form
    reason = (data.get('reason') or '').strip()
    if not reason:
        return jsonify({'error': 'Mandatory rejection reason required'}), 400

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET approval_status = 'rejected', rejection_reason = ? WHERE id = ?", (reason, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'REJECT', ?, 'Rejected', ?)
    ''', (admin_id, product_id, current['approval_status'], reason))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'status': 'rejected', 'reason': reason})

@app.route('/api/admin/products/<int:product_id>/toggle-visibility', methods=['POST'])
@admin_required
def api_admin_product_toggle_visibility(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    current_act = current['is_active'] if current['is_active'] is not None else 1
    new_act = 0 if current_act == 1 else 1
    conn.execute('UPDATE products SET is_active = ? WHERE id = ?', (new_act, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, ?, ?, ?, 'Toggled via admin API.')
    ''', (admin_id, product_id, 'HIDE' if new_act == 0 else 'ACTIVATE', 'Active' if current_act == 1 else 'Hidden', 'Hidden' if new_act == 0 else 'Active'))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'isActive': bool(new_act)})

@app.route('/api/admin/catalog/audit-logs', methods=['GET'])
@admin_required
def api_admin_catalog_audit_logs():
    conn = get_db()
    logs = conn.execute('''
        SELECT l.*, p.name as product_name
        FROM admin_catalog_audit_logs l
        LEFT JOIN products p ON l.product_id = p.id
        ORDER BY l.id DESC LIMIT 50
    ''').fetchall()
    conn.close()
    return jsonify({'logs': [dict(log) for log in logs]})

@app.route('/api/admin/products/<int:product_id>/approve-image', methods=['POST'])
@admin_required
def api_admin_product_approve_image(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET image_review_status = 'approved', image_correction_reason = NULL WHERE id = ?", (product_id,))
    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_APPROVE', ?, 'admin', ?, 'Product image approved via Admin API.')
    ''', (product_id, admin_id, current['image_url']))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_APPROVE', ?, 'Approved', 'Image approved via Admin API.')
    ''', (admin_id, product_id, current['image_review_status'] or 'submitted'))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'imageReviewStatus': 'approved'})

@app.route('/api/admin/products/<int:product_id>/request-image-correction', methods=['POST'])
@admin_required
def api_admin_product_request_image_correction(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    data = request.get_json(silent=True) or request.form
    reason = (data.get('reason') or '').strip()
    if not reason:
        return jsonify({'error': 'A specific reason explaining the required image correction is mandatory.'}), 400

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET image_review_status = 'needs_correction', image_correction_reason = ? WHERE id = ?", (reason, product_id))
    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_CORRECTION_REQUEST', ?, 'admin', ?, ?)
    ''', (product_id, admin_id, current['image_url'], reason))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_CORRECTION', ?, 'Needs Correction', ?)
    ''', (admin_id, product_id, current['image_review_status'] or 'submitted', reason))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'imageReviewStatus': 'needs_correction', 'reason': reason})

@app.route('/api/admin/products/<int:product_id>/replace-image', methods=['POST'])
@admin_required
def api_admin_product_replace_image(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    data = request.get_json(silent=True) or request.form
    new_url = (data.get('image_url') or '').strip()
    reason = (data.get('reason') or data.get('replacement_reason') or '').strip()

    admin_file = request.files.get('admin_image_file')
    if admin_file and admin_file.filename:
        uploaded_path, err = save_uploaded_image(admin_file)
        if err:
            return jsonify({'error': err}), 400
        new_url = uploaded_path

    if not new_url:
        return jsonify({'error': 'New replacement image URL or uploaded file is required.'}), 400
    if not reason:
        return jsonify({'error': 'A mandatory justification reason for administrative replacement is required.'}), 400

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    original_url = current['original_image_url'] or current['image_url']

    conn.execute('''
        UPDATE products
        SET image_url = ?, original_image_url = ?, image_replaced_by_admin = 1,
            admin_replaced_image_url = ?, image_replacement_reason = ?,
            image_review_status = 'approved', image_correction_reason = NULL
        WHERE id = ?
    ''', (new_url, original_url, new_url, reason, product_id))

    conn.execute('''
        INSERT INTO product_image_audit_logs (product_id, action, actor, actor_role, image_url, notes)
        VALUES (?, 'ADMIN_REPLACE', ?, 'admin', ?, ?)
    ''', (product_id, admin_id, new_url, f'Admin replaced image. Reason: {reason}. Original preserved ({original_url}).'))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'IMAGE_REPLACE', ?, ?, ?)
    ''', (admin_id, product_id, original_url, new_url, reason))

    conn.commit()
    conn.close()
    return jsonify({
        'success': True,
        'productId': product_id,
        'imageUrl': new_url,
        'originalImageUrl': original_url,
        'imageReplacedByAdmin': True,
        'imageReplacementReason': reason,
        'imageReviewStatus': 'approved'
    })

@app.route('/api/admin/products/<int:product_id>/image-audit-logs', methods=['GET'])
@admin_required
def api_admin_product_image_audit_logs(product_id):
    conn = get_db()
    logs = conn.execute('SELECT * FROM product_image_audit_logs WHERE product_id = ? ORDER BY id DESC', (product_id,)).fetchall()
    conn.close()
    return jsonify({'logs': [dict(log) for log in logs]})

# ----------------- ADMIN DELIVERY ASSIGNMENT -----------------

@app.route('/admin/orders/<int:order_id>/assign-delivery', methods=['POST'])
@admin_required
def admin_assign_delivery(order_id):
    delivery_boy_id = request.form.get('delivery_boy_id', 'DLV-001')
    delivery_boy_name = request.form.get('delivery_boy_name', 'Ravi (DLV-001)')
    
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    if not order:
        conn.close()
        flash('Order not found.', 'error')
        return redirect(url_for('admin_portal'))
    
    conn.execute('''
        UPDATE orders 
        SET assigned_delivery_boy = ?, assigned_delivery_boy_id = ?, status = 'Assigned'
        WHERE id = ?
    ''', (delivery_boy_name, delivery_boy_id, order_id))
    conn.commit()
    conn.close()
    flash(f"Order #{order['order_number']} successfully assigned to {delivery_boy_name}!", 'success')
    return redirect(url_for('admin_portal') + '#admin-section-orders')

# ----------------- DELIVERY FLEET & HANDOFF -----------------

DELIVERY_BOYS = [
    {'id': 'DLV-001', 'name': 'Ravi (DLV-001)', 'phone': '+91 94481 22334', 'vehicle': 'Honda Activa (KA-35-EA-4120)', 'locality': 'Patel Nagar'},
    {'id': 'DLV-002', 'name': 'Suresh (DLV-002)', 'phone': '+91 98450 88991', 'vehicle': 'Hero Splendor (KA-35-EB-1088)', 'locality': 'College Road'},
    {'id': 'DLV-003', 'name': 'Manjunath (DLV-003)', 'phone': '+91 97312 44556', 'vehicle': 'TVS Jupiter (KA-35-EC-9912)', 'locality': 'Station Road'},
    {'id': 'DLV-004', 'name': 'Kiran (DLV-004)', 'phone': '+91 96110 33445', 'vehicle': 'Bajaj Pulsar (KA-35-ED-5521)', 'locality': 'Dam Road'}
]

@app.route('/delivery')
def delivery_dashboard():
    active_driver_id = request.args.get('driver_id', 'DLV-001')
    active_tab = request.args.get('tab', 'assigned')
    active_order_id = request.args.get('order_id', type=int)

    current_driver = next((d for d in DELIVERY_BOYS if d['id'] == active_driver_id), DELIVERY_BOYS[0])

    conn = get_db()
    
    # Query orders assigned to this driver ONLY
    orders_query = '''
        SELECT * FROM orders
        WHERE (assigned_delivery_boy_id = ? OR assigned_delivery_boy LIKE ?)
        ORDER BY id DESC
    '''
    orders_raw = conn.execute(orders_query, (active_driver_id, f"%{active_driver_id}%")).fetchall()

    orders_data = []
    for ord_row in orders_raw:
        items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (ord_row['id'],)).fetchall()
        checked_count = len([it for it in items if it['delivery_checked']])
        all_checked = len(items) > 0 and checked_count == len(items)
        orders_data.append({
            'order': ord_row,
            'items': items,
            'checked_count': checked_count,
            'all_checked': all_checked
        })

    selected_order = None
    if active_order_id:
        selected_order = next((o for o in orders_data if o['order']['id'] == active_order_id), None)
    if not selected_order and orders_data:
        selected_order = orders_data[0]

    # Counts - strictly only Assigned status in assigned tab
    tab_counts = {
        'assigned': len([o for o in orders_data if o['order']['status'] == 'Assigned']),
        'picked_up': len([o for o in orders_data if o['order']['status'] in ('Picked Up', 'Out for Delivery')]),
        'delivered': len([o for o in orders_data if o['order']['status'] == 'Delivered'])
    }

    conn.close()
    return render_template(
        'delivery.html',
        drivers=DELIVERY_BOYS,
        current_driver=current_driver,
        active_tab=active_tab,
        orders=orders_data,
        selected_order=selected_order,
        tab_counts=tab_counts
    )

@app.route('/delivery/orders/<int:order_id>/toggle-check/<int:item_id>', methods=['POST'])
def delivery_toggle_item_check(order_id, item_id):
    driver_id = request.form.get('driver_id', 'DLV-001')
    conn = get_db()
    item = conn.execute('SELECT delivery_checked FROM order_items WHERE id = ? AND order_id = ?', (item_id, order_id)).fetchone()
    if item:
        new_val = 0 if item['delivery_checked'] else 1
        conn.execute('UPDATE order_items SET delivery_checked = ? WHERE id = ?', (new_val, item_id))
        conn.commit()
    conn.close()
    return redirect(url_for('delivery_dashboard', driver_id=driver_id, order_id=order_id))

@app.route('/delivery/orders/<int:order_id>/report-discrepancy', methods=['POST'])
def delivery_report_discrepancy(order_id):
    driver_id = request.form.get('driver_id', 'DLV-001')
    reason = request.form.get('reason', '').strip()
    if not reason:
        reason = "Quantity or item mismatch noted by delivery driver during vendor pickup."
    
    conn = get_db()
    conn.execute('UPDATE orders SET delivery_discrepancy = ? WHERE id = ?', (reason, order_id))
    conn.commit()
    conn.close()
    flash(f"Discrepancy reported for Order #{order_id}. Pickup is blocked until resolved.", 'warning')
    return redirect(url_for('delivery_dashboard', driver_id=driver_id, order_id=order_id))

@app.route('/delivery/orders/<int:order_id>/resolve-discrepancy', methods=['POST'])
def delivery_resolve_discrepancy(order_id):
    driver_id = request.form.get('driver_id', 'DLV-001')
    conn = get_db()
    conn.execute('UPDATE orders SET delivery_discrepancy = NULL WHERE id = ?', (order_id,))
    conn.commit()
    conn.close()
    flash(f"Discrepancy resolved for Order #{order_id}. You may now proceed with pickup verification.", 'info')
    return redirect(url_for('delivery_dashboard', driver_id=driver_id, order_id=order_id))

@app.route('/delivery/orders/<int:order_id>/confirm-pickup', methods=['POST'])
def delivery_confirm_pickup(order_id):
    driver_id = request.form.get('driver_id', 'DLV-001')
    conn = get_db()
    
    # Check discrepancy
    order = conn.execute('SELECT delivery_discrepancy FROM orders WHERE id = ?', (order_id,)).fetchone()
    if order and order['delivery_discrepancy']:
        conn.close()
        flash('Cannot confirm pickup: An unresolved discrepancy is active for this order.', 'error')
        return redirect(url_for('delivery_dashboard', driver_id=driver_id, order_id=order_id))
    
    # Check all items verified
    items = conn.execute('SELECT delivery_checked FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    unverified = [it for it in items if not it['delivery_checked']]
    if unverified:
        conn.close()
        flash(f'Cannot confirm pickup: {len(unverified)} item(s) have not been checked off against the vendor package.', 'error')
        return redirect(url_for('delivery_dashboard', driver_id=driver_id, order_id=order_id))
    
    conn.execute('''
        UPDATE orders 
        SET status = 'Picked Up', delivery_verified = 1, picked_up_at = datetime('now')
        WHERE id = ?
    ''', (order_id,))
    conn.commit()
    conn.close()
    flash(f'Order #{order_id} confirmed picked up! Ready for dispatch to customer address.', 'success')
    return redirect(url_for('delivery_dashboard', driver_id=driver_id, tab='picked_up', order_id=order_id))

@app.route('/delivery/orders/<int:order_id>/mark-delivered', methods=['POST'])
def delivery_mark_delivered(order_id):
    driver_id = request.form.get('driver_id', 'DLV-001')
    conn = get_db()
    conn.execute('''
        UPDATE orders 
        SET status = 'Delivered', delivered_at = datetime('now')
        WHERE id = ?
    ''', (order_id,))
    conn.commit()
    conn.close()
    flash(f'Order #{order_id} marked as DELIVERED successfully! Payment collected.', 'success')
    return redirect(url_for('delivery_dashboard', driver_id=driver_id, tab='delivered', order_id=order_id))

@app.route('/delivery/track/<int:order_id>')
def delivery_location_tracking(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    if not order:
        conn.close()
        flash('Order not found', 'warning')
        return redirect(url_for('delivery_dashboard'))
    items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    conn.close()
    return render_template('delivery_tracking.html', order=order, items=items)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
