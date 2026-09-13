CREATE TYPE application_type AS ENUM ('hacker', 'judge', 'mentor');

CREATE TYPE application_status AS ENUM ('draft', 'pending', 'accepted', 'rejected', 'waitlist');

CREATE TYPE points_transaction_type AS ENUM ('workshop', 'referral', 'admin');

CREATE TABLE teams (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
	admin BOOLEAN NOT NULL DEFAULT FALSE,
	judge BOOLEAN NOT NULL DEFAULT FALSE,
	mentor BOOLEAN NOT NULL DEFAULT FALSE,
	qr_code_link TEXT,
	checked_in BOOLEAN NOT NULL DEFAULT FALSE,
	team_id UUID REFERENCES teams(id) ON DELETE SET NULL
);

CREATE INDEX users_team_id_idx ON users(team_id);

CREATE TABLE meals (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	starts_at TIMESTAMPTZ NOT NULL,
	ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE meal_attendance (
	meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	checked_in_at TIMESTAMPTZ NOT NULL,
	UNIQUE (meal_id, user_id)
);

CREATE INDEX meal_attendance_user_id_idx ON meal_attendance(user_id);

CREATE TABLE workshops (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	room TEXT NOT NULL,
	starts_at TIMESTAMPTZ NOT NULL,
	ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE workshop_attendance (
	workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	checked_in_at TIMESTAMPTZ NOT NULL,
	UNIQUE (workshop_id, user_id)
);

CREATE INDEX workshop_attendance_user_id_idx ON workshop_attendance(user_id);

CREATE TABLE referrals (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX referrals_referrer_user_id_idx ON referrals(referrer_user_id);

CREATE TABLE tracks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	description TEXT NOT NULL
);

CREATE TABLE team_tracks (
	team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
	track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
	UNIQUE (team_id, track_id)
);

CREATE INDEX team_tracks_track_id_idx ON team_tracks(track_id);

CREATE TABLE judging_scores (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	judge_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
	track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
	score NUMERIC NOT NULL,
	comments TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (judge_id, team_id, track_id)
);

CREATE INDEX judging_scores_judge_id_idx ON judging_scores(judge_id);
CREATE INDEX judging_scores_team_id_idx ON judging_scores(team_id);
CREATE INDEX judging_scores_track_id_idx ON judging_scores(track_id);

CREATE TABLE applications (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
	application_type application_type NOT NULL,
	status application_status NOT NULL DEFAULT 'draft',
	email TEXT NOT NULL
);

CREATE TABLE hacker_applications (
	user_id UUID PRIMARY KEY REFERENCES applications(user_id) ON DELETE RESTRICT,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	preferred_name TEXT NOT NULL,
	phone_number TEXT NOT NULL,
	date_of_birth DATE NOT NULL,
	t_shirt_size TEXT NOT NULL,
	city TEXT NOT NULL,
	province TEXT NOT NULL,
	dietary_restrictions TEXT[] NOT NULL,
	dietary_other TEXT NOT NULL,
	accessibility_accommodations TEXT[] NOT NULL,
	accessibility_other TEXT NOT NULL,
	school_name TEXT NOT NULL,
	grade TEXT NOT NULL,
	graduation_year TEXT NOT NULL,
	school_city TEXT NOT NULL,
	parent_name TEXT NOT NULL,
	parent_email TEXT NOT NULL,
	parent_phone TEXT NOT NULL,
	emergency_contact_name TEXT NOT NULL,
	emergency_contact_phone TEXT NOT NULL,
	emergency_contact_relationship TEXT NOT NULL,
	emergency_contact_relationship_other TEXT NOT NULL,
	hackathon_experience TEXT NOT NULL,
	heard_about_hts TEXT NOT NULL,
	heard_about_hts_other TEXT NOT NULL,
	application_questions_1 TEXT NOT NULL,
	application_questions_2 TEXT NOT NULL,
	application_questions_3 TEXT NOT NULL,
	application_questions_4 TEXT NOT NULL,
	application_questions_5 TEXT NOT NULL,
	eligibility_confirm BOOLEAN NOT NULL,
	information_confirm BOOLEAN NOT NULL,
	parental_confirm BOOLEAN NOT NULL,
	terms_agreed BOOLEAN NOT NULL
);

CREATE TABLE judge_applications (
	user_id UUID PRIMARY KEY REFERENCES applications(user_id) ON DELETE RESTRICT,
	name TEXT NOT NULL,
	company_organization TEXT NOT NULL,
	job_title TEXT NOT NULL,
	linkedin_url TEXT,
	industry_field TEXT NOT NULL,
	expertise TEXT[] NOT NULL,
	years_of_professional_experience TEXT NOT NULL,
	strong_project_description TEXT NOT NULL,
	professional_background TEXT NOT NULL,
	judging_experience TEXT NOT NULL,
	available_for_full_judging_period BOOLEAN NOT NULL,
	terms_agreed BOOLEAN NOT NULL,
	eligibility_confirm BOOLEAN NOT NULL,
	information_confirm BOOLEAN NOT NULL,
	participation_confirm BOOLEAN NOT NULL
);

CREATE TABLE mentor_applications (
	user_id UUID PRIMARY KEY REFERENCES applications(user_id) ON DELETE RESTRICT,
	name TEXT NOT NULL,
	university_college TEXT NOT NULL,
	program_and_year_of_study TEXT NOT NULL,
	linkedin_portfolio_github_url TEXT,
	mentoring_areas TEXT[] NOT NULL,
	technologies_and_tools TEXT NOT NULL,
	mentoring_experience TEXT NOT NULL,
	mentoring_goals TEXT NOT NULL,
	available_for_full_event BOOLEAN NOT NULL,
	times_unavailable TEXT,
	terms_agreed BOOLEAN NOT NULL,
	eligibility_confirm BOOLEAN NOT NULL,
	information_confirm BOOLEAN NOT NULL,
	participation_confirm BOOLEAN NOT NULL
);

CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type points_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    affected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    admin_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX points_transactions_affected_user_id_idx ON points_transactions(affected_user_id);
CREATE INDEX points_transactions_admin_id_idx ON points_transactions(admin_id);