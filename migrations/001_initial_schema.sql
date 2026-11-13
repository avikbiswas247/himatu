-- HIMATU PostgreSQL schema v1.0
-- Run on a NEW, empty Neon PostgreSQL database.
-- Raw SQL only. UUID primary keys. Money uses NUMERIC, never FLOAT.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Identity and access
CREATE TABLE users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email VARCHAR(255), phone VARCHAR(30), password_hash TEXT,
 full_name VARCHAR(160) NOT NULL, email_verified_at TIMESTAMPTZ,
 phone_verified_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT TRUE,
 last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE UNIQUE INDEX users_email_uq ON users(lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_uq ON users(phone) WHERE phone IS NOT NULL;

CREATE TABLE user_addresses (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 label VARCHAR(50), recipient_name VARCHAR(160) NOT NULL, phone VARCHAR(30) NOT NULL,
 address_line_1 TEXT NOT NULL, address_line_2 TEXT, area VARCHAR(120),
 city VARCHAR(120) NOT NULL, district VARCHAR(120), postal_code VARCHAR(20),
 country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh', is_default BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_addresses_user_idx ON user_addresses(user_id);
CREATE UNIQUE INDEX user_default_address_uq ON user_addresses(user_id) WHERE is_default;

CREATE TABLE roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(80) NOT NULL UNIQUE, description TEXT);
CREATE TABLE permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(120) NOT NULL UNIQUE, description TEXT);
CREATE TABLE user_roles (
 user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 role_id UUID REFERENCES roles(id) ON DELETE CASCADE, assigned_at TIMESTAMPTZ DEFAULT now(),
 PRIMARY KEY(user_id, role_id)
);
CREATE TABLE role_permissions (
 role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
 permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
 PRIMARY KEY(role_id, permission_id)
);
-- Employees, attendance, tasks
CREATE TABLE employees (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
 employee_code VARCHAR(50) NOT NULL UNIQUE, full_name VARCHAR(160) NOT NULL,
 phone VARCHAR(30), email VARCHAR(255), job_title VARCHAR(120), department VARCHAR(120),
 employment_status VARCHAR(20) NOT NULL DEFAULT 'active'
 CHECK(employment_status IN ('active','inactive','on_leave','terminated')),
 hire_date DATE, salary_amount NUMERIC(14,2) CHECK(salary_amount IS NULL OR salary_amount >= 0),
 salary_currency CHAR(3) NOT NULL DEFAULT 'BDT',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE attendance_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
 work_date DATE NOT NULL, check_in_at TIMESTAMPTZ, check_out_at TIMESTAMPTZ,
 status VARCHAR(20) NOT NULL DEFAULT 'present'
 CHECK(status IN ('present','absent','late','half_day','leave','holiday')),
 note TEXT, recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(employee_id,work_date),
 CHECK(check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at)
);
CREATE INDEX attendance_date_idx ON attendance_records(work_date DESC);
CREATE TABLE tasks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(220) NOT NULL, description TEXT,
 status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','blocked','review','completed','cancelled')),
 priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
 assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
 created_by UUID REFERENCES users(id) ON DELETE SET NULL, due_at TIMESTAMPTZ,
 completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_assignee_status_idx ON tasks(assigned_to,status);
CREATE TABLE task_comments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL, body TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);

-- Catalogue
CREATE TABLE brands (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL UNIQUE,
 slug VARCHAR(150) NOT NULL UNIQUE, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE categories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
 name VARCHAR(120) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, description TEXT, image_url TEXT,
 sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(parent_id,name)
);
CREATE INDEX categories_parent_idx ON categories(parent_id);
CREATE TABLE collections (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(140) NOT NULL,
 slug VARCHAR(160) NOT NULL UNIQUE, description TEXT, cover_image_url TEXT,
 starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true,
 CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE TABLE products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(220) NOT NULL,
 slug VARCHAR(240) NOT NULL UNIQUE, sku VARCHAR(80) UNIQUE, product_code VARCHAR(80) UNIQUE,
 brand_id UUID REFERENCES brands(id) ON DELETE SET NULL, description TEXT, product_story TEXT,
 materials TEXT, specifications JSONB NOT NULL DEFAULT '{}',
 product_type VARCHAR(30) NOT NULL DEFAULT 'physical'
 CHECK(product_type IN ('physical','digital','made_to_order')),
 status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
 is_featured BOOLEAN NOT NULL DEFAULT false, seo_title VARCHAR(255), seo_description TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_status_created_idx ON products(status,created_at DESC);
CREATE INDEX products_specs_gin_idx ON products USING GIN(specifications);

CREATE TABLE product_categories (
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
 is_primary BOOLEAN NOT NULL DEFAULT false, PRIMARY KEY(product_id,category_id)
);
CREATE UNIQUE INDEX product_primary_category_uq ON product_categories(product_id) WHERE is_primary;
CREATE INDEX product_categories_category_idx ON product_categories(category_id);
CREATE TABLE collection_products (
 collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 sort_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(collection_id,product_id)
);
CREATE TABLE product_tags (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(80) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE product_tag_map (
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 tag_id UUID REFERENCES product_tags(id) ON DELETE CASCADE, PRIMARY KEY(product_id,tag_id)
);
CREATE TABLE product_images (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 image_url TEXT NOT NULL, alt_text VARCHAR(255), sort_order INTEGER NOT NULL DEFAULT 0,
 is_primary BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX product_images_product_idx ON product_images(product_id,sort_order);
CREATE UNIQUE INDEX product_primary_image_uq ON product_images(product_id) WHERE is_primary;
CREATE TABLE product_videos (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 video_url TEXT NOT NULL, thumbnail_url TEXT, title VARCHAR(180), sort_order INTEGER DEFAULT 0
);
CREATE TABLE product_variants (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 sku VARCHAR(80) NOT NULL UNIQUE, name VARCHAR(160) NOT NULL, attributes JSONB NOT NULL DEFAULT '{}',
 regular_price NUMERIC(14,2) NOT NULL CHECK(regular_price >= 0),
 sale_price NUMERIC(14,2) CHECK(sale_price IS NULL OR (sale_price >= 0 AND sale_price <= regular_price)),
 cost_price NUMERIC(14,2) CHECK(cost_price IS NULL OR cost_price >= 0),
 currency CHAR(3) NOT NULL DEFAULT 'BDT', weight_grams INTEGER CHECK(weight_grams IS NULL OR weight_grams >= 0),
 is_default BOOLEAN NOT NULL DEFAULT false, is_active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX variants_product_idx ON product_variants(product_id);
CREATE UNIQUE INDEX variant_default_uq ON product_variants(product_id) WHERE is_default;

-- Inventory is stored per purchasable variant. Available = on_hand - reserved.
CREATE TABLE inventory_balances (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE RESTRICT,
 quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK(quantity_on_hand >= 0),
 quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK(quantity_reserved >= 0),
 quantity_incoming INTEGER NOT NULL DEFAULT 0 CHECK(quantity_incoming >= 0),
 reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(quantity_reserved <= quantity_on_hand)
);
CREATE VIEW inventory_availability AS
 SELECT variant_id, quantity_on_hand, quantity_reserved,
 quantity_on_hand-quantity_reserved AS quantity_available, quantity_incoming,
 reorder_level, quantity_on_hand-quantity_reserved <= reorder_level AS is_low_stock
 FROM inventory_balances;
CREATE TABLE inventory_movements (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
 movement_type VARCHAR(30) NOT NULL CHECK(movement_type IN
 ('opening','purchase','sale','reservation','release','adjustment','return','damage','transfer_in','transfer_out')),
 quantity_delta INTEGER NOT NULL CHECK(quantity_delta <> 0),
 reference_type VARCHAR(40), reference_id UUID, note TEXT,
 created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX inventory_movements_variant_date_idx ON inventory_movements(variant_id,created_at DESC);
CREATE INDEX inventory_movements_reference_idx ON inventory_movements(reference_type,reference_id);

-- Cart and wishlist
CREATE TABLE carts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 session_key VARCHAR(160), currency CHAR(3) NOT NULL DEFAULT 'BDT',
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
 CHECK(user_id IS NOT NULL OR session_key IS NOT NULL)
);
CREATE UNIQUE INDEX cart_user_uq ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX cart_session_uq ON carts(session_key) WHERE session_key IS NOT NULL;
CREATE TABLE cart_items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
 variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
 quantity INTEGER NOT NULL CHECK(quantity > 0), added_at TIMESTAMPTZ DEFAULT now(),
 updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(cart_id,variant_id)
);
CREATE TABLE wishlists (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE wishlist_items (
 wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 added_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(wishlist_id,product_id)
);

-- Orders and payments. Snapshot columns preserve historical item/customer data.
CREATE TABLE orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number VARCHAR(40) NOT NULL UNIQUE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK(status IN
 ('pending','confirmed','processing','partially_shipped','shipped','delivered','cancelled','returned','refunded')),
 payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN
 ('unpaid','partially_paid','paid','failed','refunded','partially_refunded')),
 fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'unfulfilled'
 CHECK(fulfillment_status IN ('unfulfilled','processing','partially_fulfilled','fulfilled')),
 customer_name VARCHAR(160) NOT NULL, customer_email VARCHAR(255), customer_phone VARCHAR(30) NOT NULL,
 shipping_recipient VARCHAR(160) NOT NULL, shipping_phone VARCHAR(30) NOT NULL,
 shipping_address_line_1 TEXT NOT NULL, shipping_address_line_2 TEXT, shipping_area VARCHAR(120),
 shipping_city VARCHAR(120) NOT NULL, shipping_district VARCHAR(120), shipping_postal_code VARCHAR(20),
 shipping_country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh', billing_address JSONB,
 subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(subtotal >= 0),
 discount_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(discount_total >= 0),
 shipping_fee NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(shipping_fee >= 0),
 tax_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(tax_total >= 0),
 grand_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(grand_total >= 0),
 currency CHAR(3) NOT NULL DEFAULT 'BDT',
 payment_method VARCHAR(30) CHECK(payment_method IS NULL OR payment_method IN ('cod','bkash','nagad','rocket','card','bank_transfer','other')),
 customer_note TEXT, internal_note TEXT, placed_at TIMESTAMPTZ DEFAULT now(),
 confirmed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX orders_user_date_idx ON orders(user_id,created_at DESC);
CREATE INDEX orders_status_date_idx ON orders(status,created_at DESC);
CREATE INDEX orders_payment_status_idx ON orders(payment_status,created_at DESC);
CREATE INDEX orders_phone_idx ON orders(customer_phone);
CREATE TABLE order_items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 product_id UUID REFERENCES products(id) ON DELETE SET NULL,
 variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
 product_name VARCHAR(220) NOT NULL, variant_name VARCHAR(160), sku_snapshot VARCHAR(80),
 quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price NUMERIC(14,2) NOT NULL CHECK(unit_price >= 0),
 unit_cost NUMERIC(14,2) CHECK(unit_cost IS NULL OR unit_cost >= 0),
 discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
 line_total NUMERIC(14,2) NOT NULL CHECK(line_total >= 0), created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_product_idx ON order_items(product_id);
CREATE TABLE order_status_history (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 old_status VARCHAR(30), new_status VARCHAR(30) NOT NULL, note TEXT,
 changed_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON order_status_history(order_id,created_at DESC);

CREATE TABLE payments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 payment_reference VARCHAR(120) UNIQUE,
 provider VARCHAR(30) NOT NULL CHECK(provider IN ('cod','bkash','nagad','rocket','card','bank_transfer','other')),
 payment_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK(payment_type IN ('advance','partial','full','refund')),
 status VARCHAR(20) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','under_review','approved','paid','failed','rejected','refunded')),
 amount NUMERIC(14,2) NOT NULL CHECK(amount > 0), currency CHAR(3) NOT NULL DEFAULT 'BDT',
 provider_transaction_id VARCHAR(160), idempotency_key VARCHAR(160) UNIQUE,
 paid_at TIMESTAMPTZ, verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
 verified_at TIMESTAMPTZ, failure_reason TEXT, metadata JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments(order_id,created_at DESC);
CREATE INDEX payments_status_idx ON payments(status,created_at DESC);
CREATE TABLE payment_proofs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
 file_url TEXT NOT NULL, uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE invoices (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
 invoice_number VARCHAR(50) NOT NULL UNIQUE, issued_at TIMESTAMPTZ DEFAULT now(), pdf_url TEXT,
 snapshot JSONB NOT NULL DEFAULT '{}'
);

-- Courier and shipments (one order can have multiple shipments)
CREATE TABLE couriers (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL UNIQUE,
 code VARCHAR(50) NOT NULL UNIQUE, tracking_url_template TEXT,
 api_enabled BOOLEAN NOT NULL DEFAULT false, is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE shipments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
 courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL, tracking_number VARCHAR(120),
 courier_order_id VARCHAR(160), status VARCHAR(30) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','booked','picked_up','in_transit','out_for_delivery','delivered','failed','returned','cancelled')),
 shipping_fee NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(shipping_fee >= 0),
 shipped_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, raw_courier_response JSONB,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX shipments_order_idx ON shipments(order_id);
CREATE INDEX shipments_tracking_idx ON shipments(tracking_number);
CREATE TABLE shipment_tracking_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
 event_code VARCHAR(80), status VARCHAR(80) NOT NULL, description TEXT, location VARCHAR(180),
 occurred_at TIMESTAMPTZ, source VARCHAR(30) NOT NULL DEFAULT 'manual'
 CHECK(source IN ('manual','courier_api','webhook')), raw_payload JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX shipment_events_idx ON shipment_tracking_events(shipment_id,occurred_at DESC);
CREATE TABLE shipping_labels (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
 label_url TEXT, label_format VARCHAR(20) NOT NULL DEFAULT 'pdf' CHECK(label_format IN ('pdf','png','zpl')),
 generated_at TIMESTAMPTZ DEFAULT now(), generated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Custom 3D orders and production
CREATE TABLE custom_orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), custom_order_number VARCHAR(50) NOT NULL UNIQUE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 customer_name VARCHAR(160) NOT NULL, customer_email VARCHAR(255), customer_phone VARCHAR(30) NOT NULL,
 character_name VARCHAR(180) NOT NULL, description TEXT NOT NULL, preferred_size VARCHAR(100),
 customer_notes TEXT, status VARCHAR(35) NOT NULL DEFAULT 'submitted'
 CHECK(status IN ('submitted','under_review','quotation_sent','customer_approved','advance_payment_pending',
 'modeling','printing','painting','quality_check','packaging','shipping','delivered','rejected','cancelled')),
 quoted_total NUMERIC(14,2) CHECK(quoted_total IS NULL OR quoted_total >= 0),
 advance_required NUMERIC(14,2) CHECK(advance_required IS NULL OR advance_required >= 0),
 currency CHAR(3) NOT NULL DEFAULT 'BDT', assigned_employee UUID REFERENCES employees(id) ON DELETE SET NULL,
 target_delivery_at TIMESTAMPTZ, submitted_at TIMESTAMPTZ DEFAULT now(), completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX custom_orders_user_date_idx ON custom_orders(user_id,created_at DESC);
CREATE INDEX custom_orders_status_date_idx ON custom_orders(status,created_at DESC);
CREATE TABLE custom_order_references (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
 file_url TEXT NOT NULL, file_type VARCHAR(30), caption VARCHAR(255), sort_order INTEGER DEFAULT 0,
 uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE custom_quotations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
 quotation_number VARCHAR(50) NOT NULL UNIQUE, amount NUMERIC(14,2) NOT NULL CHECK(amount >= 0),
 advance_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(advance_amount >= 0),
 details TEXT, status VARCHAR(20) NOT NULL DEFAULT 'sent'
 CHECK(status IN ('draft','sent','accepted','rejected','expired','superseded')),
 valid_until TIMESTAMPTZ, sent_at TIMESTAMPTZ, responded_at TIMESTAMPTZ,
 created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now(),
 CHECK(advance_amount <= amount)
);
CREATE INDEX custom_quotations_order_idx ON custom_quotations(custom_order_id,created_at DESC);
CREATE TABLE custom_order_payments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE RESTRICT,
 quotation_id UUID REFERENCES custom_quotations(id) ON DELETE SET NULL,
 provider VARCHAR(30) NOT NULL CHECK(provider IN ('bkash','nagad','rocket','card','bank_transfer','cash','other')),
 amount NUMERIC(14,2) NOT NULL CHECK(amount > 0),
 status VARCHAR(20) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','under_review','approved','paid','rejected','refunded')),
 transaction_id VARCHAR(160), proof_url TEXT, verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
 verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_stages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) NOT NULL UNIQUE,
 name VARCHAR(100) NOT NULL UNIQUE, sort_order INTEGER NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true
);
CREATE TABLE production_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 custom_order_id UUID NOT NULL UNIQUE REFERENCES custom_orders(id) ON DELETE RESTRICT,
 status VARCHAR(25) NOT NULL DEFAULT 'not_started'
 CHECK(status IN ('not_started','in_progress','on_hold','completed','cancelled')),
 started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(),
 updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE production_stage_tasks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 production_job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
 stage_id UUID NOT NULL REFERENCES production_stages(id) ON DELETE RESTRICT,
 assigned_employee UUID REFERENCES employees(id) ON DELETE SET NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','in_progress','blocked','completed','skipped')),
 notes TEXT, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
 sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(),
 updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(production_job_id,stage_id)
);
CREATE INDEX production_tasks_assignee_idx ON production_stage_tasks(assigned_employee,status);
CREATE TABLE custom_order_status_history (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
 old_status VARCHAR(35), new_status VARCHAR(35) NOT NULL, note TEXT,
 changed_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX custom_status_history_idx ON custom_order_status_history(custom_order_id,created_at DESC);
CREATE TABLE production_stage_history (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 production_stage_task_id UUID NOT NULL REFERENCES production_stage_tasks(id) ON DELETE CASCADE,
 old_status VARCHAR(20), new_status VARCHAR(20) NOT NULL, note TEXT,
 changed_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews and media
CREATE TABLE reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
 order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
 rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5), title VARCHAR(180), body TEXT,
 is_verified BOOLEAN NOT NULL DEFAULT false,
 moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
 CHECK(moderation_status IN ('pending','approved','rejected')),
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX reviews_product_approved_idx ON reviews(product_id,created_at DESC) WHERE moderation_status='approved';
CREATE TABLE review_media (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
 media_url TEXT NOT NULL, media_type VARCHAR(20) NOT NULL CHECK(media_type IN ('image','video')),
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses, notifications, audit and first-party analytics
CREATE TABLE expense_categories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL UNIQUE, description TEXT
);
CREATE TABLE expenses (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
 description TEXT NOT NULL, amount NUMERIC(14,2) NOT NULL CHECK(amount > 0),
 currency CHAR(3) NOT NULL DEFAULT 'BDT', expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
 payment_method VARCHAR(30), vendor_name VARCHAR(180), receipt_url TEXT,
 recorded_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX expenses_date_idx ON expenses(expense_date DESC);
CREATE TABLE notifications (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 channel VARCHAR(20) NOT NULL CHECK(channel IN ('in_app','email','sms','whatsapp')),
 subject VARCHAR(255), body TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','sent','failed','read')),
 related_type VARCHAR(50), related_id UUID, sent_at TIMESTAMPTZ, read_at TIMESTAMPTZ,
 failure_reason TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX notifications_user_date_idx ON notifications(user_id,created_at DESC);
CREATE TABLE audit_logs (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 action VARCHAR(120) NOT NULL, entity_type VARCHAR(80) NOT NULL, entity_id UUID,
 old_values JSONB, new_values JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type,entity_id,created_at DESC);
CREATE INDEX audit_actor_idx ON audit_logs(actor_user_id,created_at DESC);
CREATE TABLE product_view_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL, session_key VARCHAR(160),
 source VARCHAR(80), occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX product_views_product_date_idx ON product_view_events(product_id,occurred_at DESC);

-- Seed production workflow and roles/permissions
INSERT INTO production_stages(code,name,sort_order) VALUES
 ('modeling','3D Modeling',1),('printing','3D Printing',2),('painting','Painting',3),
 ('quality_check','Quality Check',4),('packaging','Packaging',5),('shipping','Shipping',6)
ON CONFLICT(code) DO NOTHING;
INSERT INTO roles(name,description) VALUES
 ('customer','Standard customer'),('admin','Full administration'),
 ('manager','Business operations manager'),('staff','Internal staff')
ON CONFLICT(name) DO NOTHING;
INSERT INTO permissions(code,description) VALUES
 ('products.read','View products'),('products.write','Manage products'),
 ('inventory.read','View inventory'),('inventory.write','Adjust inventory'),
 ('orders.read','View orders'),('orders.write','Manage orders'),
 ('payments.verify','Verify payments'),('custom_orders.manage','Manage custom orders'),
 ('production.manage','Manage production'),('employees.manage','Manage employees'),
 ('attendance.manage','Manage attendance'),('finance.read','View financial reports'),
 ('finance.write','Record expenses'),('reviews.moderate','Moderate reviews'),
 ('users.manage','Manage users'),('settings.manage','Manage settings')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='admin'
ON CONFLICT DO NOTHING;
COMMIT;

-- Useful views
CREATE OR REPLACE VIEW product_catalogue_summary AS
SELECT p.id,p.name,p.slug,p.sku,p.status,p.is_featured,b.name AS brand_name,
 pi.image_url AS primary_image_url,COUNT(DISTINCT v.id) AS variant_count,
 MIN(COALESCE(v.sale_price,v.regular_price)) AS starting_price
FROM products p LEFT JOIN brands b ON b.id=p.brand_id
LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary
LEFT JOIN product_variants v ON v.product_id=p.id AND v.is_active
GROUP BY p.id,b.name,pi.image_url;

CREATE OR REPLACE VIEW order_item_totals AS
SELECT o.id AS order_id,o.order_number,COALESCE(SUM(i.line_total),0)::NUMERIC(14,2) AS items_total,
 COUNT(i.id)::INTEGER AS item_count
FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
GROUP BY o.id,o.order_number;

