-- Migration 106: Add missing RLS policy for document_requirements

-- Policy: authenticated users can read document requirements
CREATE POLICY "doc_req_authenticated_read" ON document_requirements
  FOR SELECT TO authenticated USING (true);

COMMENT ON POLICY "doc_req_authenticated_read" ON document_requirements IS 'Authenticated users can read document requirements for visa planning';
