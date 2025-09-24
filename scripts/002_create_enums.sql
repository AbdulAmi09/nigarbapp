-- Create custom enums for the NCAA dashboard
CREATE TYPE arbiter_level AS ENUM ('National', 'International', 'FIDE', 'Candidate');
CREATE TYPE tournament_status AS ENUM ('Scheduled', 'Ongoing', 'Completed', 'Cancelled');
CREATE TYPE assignment_status AS ENUM ('Pending', 'Accepted', 'Declined', 'Completed');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Cancelled');
CREATE TYPE notification_type AS ENUM ('Assignment', 'Payment', 'Tournament', 'System', 'Committee');
CREATE TYPE event_type AS ENUM ('Tournament', 'Training', 'Meeting', 'Conference', 'Workshop');
CREATE TYPE zone_type AS ENUM ('North', 'South', 'East', 'West', 'Central', 'FCT');
