
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS local_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_select_products"
  ON products
  FOR SELECT
  USING (true);

-- SALES: for demo purposes allow public (anon) read-only access so frontend can show sales
CREATE POLICY IF NOT EXISTS "public_select_sales"
  ON sales
  FOR SELECT
  USING (true);

-- SHIPMENTS: allow public select for demo read-only access
CREATE POLICY IF NOT EXISTS "public_select_shipments"
  ON shipments
  FOR SELECT
  USING (true);





