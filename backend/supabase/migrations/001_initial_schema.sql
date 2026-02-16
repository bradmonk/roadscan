-- Enable PostGIS for geospatial data
create extension if not exists postgis;

-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone_model text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scan sessions table
create table scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  total_distance_km float default 0,
  average_roughness float,
  status text check (status in ('active', 'paused', 'completed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sensor data points (raw data - can be pruned periodically)
create table sensor_data_points (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references scan_sessions(id) on delete cascade not null,
  timestamp timestamp with time zone not null,
  latitude float not null,
  longitude float not null,
  altitude float,
  speed float,
  acceleration_x float not null,
  acceleration_y float not null,
  acceleration_z float not null,
  gyro_x float,
  gyro_y float,
  gyro_z float,
  roughness_score float not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Aggregated scan segments (for visualization)
create table scan_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references scan_sessions(id) on delete cascade not null,
  start_lat float not null,
  start_lng float not null,
  end_lat float not null,
  end_lng float not null,
  geometry geography(LINESTRING, 4326),
  average_roughness float not null,
  segment_duration_seconds integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index scan_sessions_user_id_idx on scan_sessions(user_id);
create index scan_sessions_started_at_idx on scan_sessions(started_at desc);
create index sensor_data_points_session_id_idx on sensor_data_points(session_id);
create index sensor_data_points_timestamp_idx on sensor_data_points(timestamp);
create index scan_segments_session_id_idx on scan_segments(session_id);
create index scan_segments_geometry_idx on scan_segments using gist(geometry);

-- Enable Row Level Security
alter table users enable row level security;
alter table scan_sessions enable row level security;
alter table sensor_data_points enable row level security;
alter table scan_segments enable row level security;

-- RLS Policies for users table
create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

-- RLS Policies for scan_sessions
create policy "Users can view own scan sessions"
  on scan_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own scan sessions"
  on scan_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scan sessions"
  on scan_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own scan sessions"
  on scan_sessions for delete
  using (auth.uid() = user_id);

-- RLS Policies for sensor_data_points
create policy "Users can view own sensor data"
  on sensor_data_points for select
  using (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = sensor_data_points.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own sensor data"
  on sensor_data_points for insert
  with check (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = sensor_data_points.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete own sensor data"
  on sensor_data_points for delete
  using (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = sensor_data_points.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_segments
create policy "Users can view own scan segments"
  on scan_segments for select
  using (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = scan_segments.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own scan segments"
  on scan_segments for insert
  with check (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = scan_segments.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete own scan segments"
  on scan_segments for delete
  using (
    exists (
      select 1 from scan_sessions
      where scan_sessions.id = scan_segments.session_id
      and scan_sessions.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for users table
create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at_column();

-- Function to create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
