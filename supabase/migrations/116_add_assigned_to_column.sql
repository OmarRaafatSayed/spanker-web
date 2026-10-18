-- Add assigned_to column to travel_requests for staff assignment
ALTER TABLE travel_requests 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_travel_requests_assigned_to 
ON travel_requests(assigned_to);

-- Add comment
COMMENT ON COLUMN travel_requests.assigned_to IS 'Staff member assigned to handle this booking';
