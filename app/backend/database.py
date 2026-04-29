from sqlite3 import connect
from contextlib import contextmanager

@contextmanager
def get_db():
    conn = connect("users.db")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    # Initialize database and create table
    with get_db() as conn:
        cursor = conn.cursor()

        # Create roles table to define organizational units and access levels
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT
            )
        """)

        # Pre-populate roles based on organizational requirements
        roles_data = [
            ('Finance Team', 'Access to financial reports, marketing expenses, equipment costs, reimbursements, etc.'),
            ('Marketing Team', 'Access to campaign performance data, customer feedback, and sales metrics.'),
            ('HR Team', 'Access employee data, attendance records, payroll, and performance reviews.'),
            ('Engineering Department', 'Access to technical architecture, development processes, and operational guidelines.'),
            ('C-Level Executives', 'Full access to all company data.'),
            ('Employee Level', 'Access only to general company information such as policies, events, and FAQs.')
        ]
        cursor.executemany("INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)", roles_data)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT, 
                email TEXT UNIQUE NOT NULL, 
                password TEXT,
                role_id INTEGER,
                data TEXT,
                is_logged_in INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles (id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT, 
                email TEXT UNIQUE NOT NULL, 
                password TEXT,
                role_id INTEGER,
                data TEXT,
                is_logged_in INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles (id)
            )
        """)
        conn.commit()