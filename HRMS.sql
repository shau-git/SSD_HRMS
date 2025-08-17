CREATE TABLE employees(
  employee_id      SERIAL        PRIMARY KEY,
  first_name       VARCHAR(20)   NOT NULL,
  last_name        VARCHAR(20)   NOT NULL,
  email            VARCHAR(52)  NOT NULL UNIQUE,
  hashed_password  VARCHAR(255)  NOT NULL,
  is_active        BOOLEAN      NOT NULL DEFAULT false, 
  role             CHAR(1)      NOT NULL CHECK (role IN ('A', 'E', 'W')),  --Admin , Employer, Worker
  medical_leave    FLOAT         NOT NULL CHECK(medical_leave >= 0),
  annual_leave     FLOAT         NOT NULL CHECK(annual_leave >= 0),
 	created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  manager_id       SMALLINT      ,
  is_new              BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT fk_manager FOREIGN KEY (manager_id)
    REFERENCES employees (employee_id)
);



CREATE TABLE attendance(
  attendance_id  SERIAL        PRIMARY KEY,
  employee_id    SMALLINT    NOT NULL,
  leave_id       SMALLINT    DEFAULT null,
  start_date_time   TIMESTAMP,
  end_date_time      TIMESTAMP  CHECK(end_date_time  > start_date_time),
  day           CHAR(3)    NOT NULL CHECK(day IN ('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  total_min_work SMALLINT  DEFAULT 0 CHECK (total_min_work >= 0),
  total_min_adjusted SMALLINT  DEFAULT 0 CHECK (total_min_adjusted  >= 0)  NOT NULL,
  is_ot          BOOLEAN       NOT NULL DEFAULT FALSE,
  hours_of_ot      SMALLINT DEFAULT 0 CHECK (total_min_adjusted  >= 0)  NOT NULL, 
  remarks        VARCHAR(40) DEFAULT NULL,
  leave_remarks          VARCHAR(40)    ,
  is_amended     BOOLEAN    NOT NULL DEFAULT FALSE,  
  edit_status      VARCHAR(8)   CHECK (edit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ot_req_status   VARCHAR(8)   CHECK (ot_req_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  edit_date_time  TIMESTAMP ,
  response_date_time   TIMESTAMP  CHECK(response_date_time  >= edit_date_time),
  read           BOOLEAN,
  manager_id     SMALLINT NOT NULL,
  CONSTRAINT fk_employee FOREIGN KEY (employee_id)
    REFERENCES employees (employee_id),
  CONSTRAINT fk_manager FOREIGN KEY (manager_id)
    REFERENCES employees (employee_id)
);


CREATE TABLE leave(
  leave_id         SERIAL        PRIMARY KEY,
  employee_id      SMALLINT      NOT NULL,
  attendance_id    SMALLINT      NULL,
  start_date_time  TIMESTAMP      NOT NULL,
  end_date_time    TIMESTAMP      NOT NULL CHECK(end_date_time  > start_date_time),
  day           VARCHAR(3)    NOT NULL CHECK(day IN ('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  duration      VARCHAR(4)    NOT NULL CHECK (duration IN ('FULL', 'AM', 'PM')),
  type             CHAR(2)       NOT NULL CHECK (type IN ('AL', 'ML')),
  leave_remarks          VARCHAR(40)    NOT NULL,
  status           VARCHAR(9)   NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  submit_date_time TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  response_date_time     TIMESTAMP   CHECK(response_date_time  >= submit_date_time),
  withdraw_date_time    TIMESTAMP     CHECK(withdraw_date_time  >= submit_date_time),
  manager_id       SMALLINT        NOT NULL,
  read           BOOLEAN,
  read_withdraw  BOOLEAN, 
  CONSTRAINT fk_employee FOREIGN KEY (employee_id)
    REFERENCES employees (employee_id),
  CONSTRAINT fk_manager FOREIGN KEY (manager_id)
    REFERENCES employees (employee_id),
  CONSTRAINT fk_attendance FOREIGN KEY (attendance_id)
    REFERENCES attendance (attendance_id) ON DELETE SET NULL
);



ALTER TABLE attendance
ADD CONSTRAINT fk_leave
FOREIGN KEY (leave_id) 
REFERENCES leave(leave_id) ON DELETE cascade;


CREATE TABLE attendance_edit_request(
  request_id         SERIAL        PRIMARY KEY,
  employee_id      SMALLINT      NOT NULL,
  attendance_id    SMALLINT      NOT NULL UNIQUE,
  start_date_time  TIMESTAMP      NOT NULL,
  end_date_time    TIMESTAMP      NOT NULL CHECK(end_date_time  > start_date_time),
  day           VARCHAR(3)    NOT NULL CHECK(day IN ('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  is_ot            BOOLEAN      DEFAULT False NOT NULL,
  hours_of_ot     SMALLINT    DEFAULT 0 CHECK (hours_of_ot  >= 0) NOT NULL,  
  remarks        VARCHAR(40)   NOT NULL,   
  edit_date_time  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edit_status           VARCHAR(8)    CHECK (edit_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  manager_id       SMALLINT        NOT NULL,
  CONSTRAINT fk_employee FOREIGN KEY (employee_id)
    REFERENCES employees (employee_id),
  CONSTRAINT fk_attendance FOREIGN KEY (attendance_id)
    REFERENCES attendance (attendance_id) ON delete cascade,
  CONSTRAINT fk_manager FOREIGN KEY (manager_id)
    REFERENCES employees (employee_id)
);


-- This are some sample data only

INSERT INTO employees (employee_id, first_name, last_name, email, hashed_password, is_active, role, medical_leave, annual_leave, manager_id, is_new)
VALUES
(1, 'Admin', 'User', 'admin@company.com', 'placeholder_hashed_password_1', true, 'A', 15, 14, 1, false),
(2, 'Michael', 'Scott', 'michael@company.com', 'placeholder_hashed_password_2', true, 'E', 15, 14, 1, false),
(3, 'Toby', 'Flenderson', 'toby@company.com', 'placeholder_hashed_password_3', true, 'E', 15, 14, 1, false),
(4, 'Jim', 'Halpert', 'jim@company.com', 'placeholder_hashed_password_4', true, 'W', 15, 14, 2, false),
(5, 'Pam', 'Beesly', 'pam@company.com', 'placeholder_hashed_password_5', true, 'W', 15, 14, 2, false),
(6, 'Dwight', 'Schrute', 'dwight@company.com', 'placeholder_hashed_password_6', true, 'W', 15, 14, 3, false),
(7, 'Angela', 'Martin', 'angela@company.com', 'placeholder_hashed_password_7', true, 'W', 15, 14, 3, false);

-- Insert data into the 'attendance' table
INSERT INTO attendance (attendance_id, employee_id, leave_id, start_date_time, end_date_time, day, total_min_work, total_min_adjusted, is_ot, hours_of_ot, remarks, is_amended, manager_id)
VALUES
(1, 4, null, '2025-08-16 09:00:00', '2025-08-16 17:00:00', 'Sat', 480, 480, false, 0, 'Regular Saturday shift.', false, 2),
(2, 5, null, '2025-08-16 09:00:00', '2025-08-16 17:00:00', 'Sat', 480, 480, false, 0, 'Regular work day.', false, 2),
(3, 6, null, '2025-08-16 08:30:00', '2025-08-16 17:30:00', 'Sat', 540, 540, false, 0, 'Morning shift completed.', false, 3),
(4, 7, null, '2025-08-16 09:00:00', '2025-08-16 18:00:00', 'Sat', 540, 540, true, 1, 'Overtime for team report.', false, 3),
(5, 4, null, '2025-08-17 09:00:00', '2025-08-17 17:00:00', 'Sun', 480, 480, false, 0, 'Standard Sunday work.', false, 2);

-- Insert data into the 'leave' table
INSERT INTO leave (leave_id, employee_id, attendance_id, start_date_time, end_date_time, day, duration, type, leave_remarks, status, submit_date_time, manager_id, read_withdraw)
VALUES
(1, 5, null, '2025-08-18 09:00:00', '2025-08-18 17:00:00', 'Mon', 'FULL', 'AL', 'Family emergency.', 'PENDING', '2025-08-15 10:00:00', 2, null),
(2, 4, null, '2025-08-19 13:00:00', '2025-08-19 17:00:00', 'Tue', 'PM', 'ML', 'Dental appointment.', 'APPROVED', '2025-08-14 11:30:00', 2, null),
(3, 6, null, '2025-08-20 09:00:00', '2025-08-20 17:00:00', 'Wed', 'FULL', 'AL', 'Personal day.', 'WITHDRAWN', '2025-08-15 15:00:00', 3, true);


-- Insert data into the 'attendance_edit_request' table
INSERT INTO attendance_edit_request (request_id, employee_id, attendance_id, start_date_time, end_date_time, day, is_ot, hours_of_ot, remarks, edit_status, manager_id)
VALUES
(1, 4, 1, '2025-08-16 09:15:00', '2025-08-16 17:00:00', 'Sat', false, 0, 'Forgot to clock in on time, requesting a change.', 'PENDING', 2),
(2, 6, 3, '2025-08-16 08:30:00', '2025-08-16 18:00:00', 'Sat', true, 0, 'Initially forgot to mark my overtime.', 'APPROVED', 3);













