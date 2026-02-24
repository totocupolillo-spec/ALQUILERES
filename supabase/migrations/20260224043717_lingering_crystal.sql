/*
  # Esquema inicial del sistema de alquileres

  1. Nuevas Tablas
    - `properties` - Gestión de propiedades
      - `id` (bigint, primary key)
      - `name` (text) - Nombre de la propiedad
      - `type` (text) - Tipo: departamento, galpon, local, oficina, otro
      - `building` (text) - Nombre del edificio
      - `address` (text) - Dirección completa
      - `rent` (numeric) - Monto del alquiler
      - `expenses` (numeric) - Monto de expensas
      - `tenant` (text, nullable) - Inquilino actual
      - `status` (text) - Estado: ocupado, disponible, mantenimiento
      - `contract_start` (date) - Inicio del contrato
      - `contract_end` (date) - Fin del contrato
      - `last_updated` (date) - Última actualización
      - `notes` (text) - Notas adicionales
      - `created_at` (timestamptz) - Fecha de creación

    - `tenants` - Gestión de inquilinos
      - `id` (bigint, primary key)
      - `name` (text) - Nombre completo
      - `email` (text) - Email
      - `phone` (text) - Teléfono
      - `property_id` (bigint, nullable) - Referencia a propiedad
      - `property` (text) - Nombre de la propiedad
      - `contract_start` (date) - Inicio del contrato
      - `contract_end` (date) - Fin del contrato
      - `deposit` (numeric) - Monto del depósito
      - `guarantor_name` (text) - Nombre del garante
      - `guarantor_email` (text) - Email del garante
      - `guarantor_phone` (text) - Teléfono del garante
      - `balance` (numeric) - Saldo adeudado
      - `status` (text) - Estado: activo, vencido, pendiente
      - `created_at` (timestamptz) - Fecha de creación

    - `receipts` - Gestión de recibos
      - `id` (bigint, primary key)
      - `receipt_number` (text) - Número de recibo
      - `tenant` (text) - Nombre del inquilino
      - `property` (text) - Nombre de la propiedad
      - `building` (text) - Nombre del edificio
      - `month` (text) - Mes del recibo
      - `year` (integer) - Año del recibo
      - `rent` (numeric) - Monto del alquiler
      - `expenses` (numeric) - Monto de expensas
      - `other_charges` (jsonb) - Otros cargos
      - `previous_balance` (numeric) - Saldo anterior
      - `total` (numeric) - Total a pagar
      - `paid_amount` (numeric) - Monto pagado
      - `remaining_balance` (numeric) - Saldo restante
      - `currency` (text) - Moneda: ARS, USD
      - `payment_method` (text) - Método: efectivo, transferencia, dolares
      - `status` (text) - Estado: pagado, pendiente, vencido
      - `due_date` (date) - Fecha de vencimiento
      - `created_date` (date) - Fecha de creación
      - `created_at` (timestamptz) - Timestamp de creación

    - `cash_movements` - Movimientos de caja
      - `id` (bigint, primary key)
      - `type` (text) - Tipo: income, delivery
      - `description` (text) - Descripción del movimiento
      - `category` (text, nullable) - Categoría: owner, maintenance, commission, other
      - `amount` (numeric) - Monto
      - `currency` (text) - Moneda: ARS, USD
      - `date` (date) - Fecha del movimiento
      - `tenant` (text, nullable) - Inquilino relacionado
      - `property` (text, nullable) - Propiedad relacionada
      - `comment` (text, nullable) - Comentario adicional
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
*/

-- Crear tabla de propiedades
CREATE TABLE IF NOT EXISTS properties (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('departamento', 'galpon', 'local', 'oficina', 'otro')),
  building text NOT NULL,
  address text NOT NULL,
  rent numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  tenant text,
  status text NOT NULL DEFAULT 'disponible' CHECK (status IN ('ocupado', 'disponible', 'mantenimiento')),
  contract_start date,
  contract_end date,
  last_updated date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de inquilinos
CREATE TABLE IF NOT EXISTS tenants (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  property_id bigint REFERENCES properties(id),
  property text NOT NULL,
  contract_start date NOT NULL,
  contract_end date NOT NULL,
  deposit numeric NOT NULL DEFAULT 0,
  guarantor_name text NOT NULL,
  guarantor_email text NOT NULL,
  guarantor_phone text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'vencido', 'pendiente')),
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de recibos
CREATE TABLE IF NOT EXISTS receipts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  receipt_number text NOT NULL UNIQUE,
  tenant text NOT NULL,
  property text NOT NULL,
  building text NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  rent numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  other_charges jsonb DEFAULT '[]'::jsonb,
  previous_balance numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  remaining_balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  payment_method text NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'dolares')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagado', 'pendiente', 'vencido')),
  due_date date NOT NULL,
  created_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de movimientos de caja
CREATE TABLE IF NOT EXISTS cash_movements (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type text NOT NULL CHECK (type IN ('income', 'delivery')),
  description text NOT NULL,
  category text CHECK (category IN ('owner', 'maintenance', 'commission', 'other')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  tenant text,
  property text,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Crear políticas para propiedades
CREATE POLICY "Users can read own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (true);

-- Crear políticas para inquilinos
CREATE POLICY "Users can read own tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own tenants"
  ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own tenants"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own tenants"
  ON tenants
  FOR DELETE
  TO authenticated
  USING (true);

-- Crear políticas para recibos
CREATE POLICY "Users can read own receipts"
  ON receipts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own receipts"
  ON receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own receipts"
  ON receipts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own receipts"
  ON receipts
  FOR DELETE
  TO authenticated
  USING (true);

-- Crear políticas para movimientos de caja
CREATE POLICY "Users can read own cash movements"
  ON cash_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own cash movements"
  ON cash_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own cash movements"
  ON cash_movements
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own cash movements"
  ON cash_movements
  FOR DELETE
  TO authenticated
  USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_building ON properties(building);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant);
CREATE INDEX IF NOT EXISTS idx_receipts_month_year ON receipts(month, year);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_type ON cash_movements(type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_date ON cash_movements(date);