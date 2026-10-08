CREATE TABLE semanas_planificadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_semana VARCHAR(100) NOT NULL,
    data_reporte JSONB NOT NULL,
    data_personas JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE semanas_planificadas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public access to semanas" 
ON semanas_planificadas FOR ALL 
USING (true)
WITH CHECK (true);
