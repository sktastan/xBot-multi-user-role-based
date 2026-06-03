//===========================================================
//  
//  users_login_form.tsx
//  Form component for existing user authentication.
//  
//============================================================
import React from "react";
// import ThemeToggle from "../ThemeToggle";

// ---------------------------------------------------------------------
//   Helper function to send login credentials to the backend.
// -------------------------------------------------------------------
const loginUser = async (user: { email: string; password: string }) => {
    console.log("Logging in user:", user);
    try {
        // Use window.location.origin to work on localhost, network IP, and behind HTTPS proxies:
        const API_URL = `${window.location.origin}/login`;
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Invalid email or password");
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("User processed successfully:", data);
        return data;
    } catch (error) {
        console.error("Error sending user data:", error);
        return null;
    }
}

// ---------------------------------------------------------------------
//   Props for the UserLoginForm component.
// -------------------------------------------------------------------
interface LoginProps {
    onLoginSuccess: (user: { name: string; email: string; data?: string | null }) => void;
}

// ---------------------------------------------------------------------
//   UserLoginForm component definition.
// -------------------------------------------------------------------
const UserLoginForm: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    // Demonstrating useEffect: runs when the login form is shown
    React.useEffect(() => {
        console.log("Login form module initialized");
    }, []);

    // ---------------------------------------------------------------------
    //   Validates input and performs the login request.
    // -------------------------------------------------------------------
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        const user = { email, password };
        setIsLoading(true);
        
        const result = await loginUser(user);
        setIsLoading(false);

        // Safety check: Ensure result is not null before accessing properties
        if (result && result.email === user.email) {
            console.log("User logged in:", result);
            setEmail('');
            setPassword('');
            onLoginSuccess(result);
        } else if (result === null) {
            // LoginUser returns null on catch/error
            setError('Login failed: Invalid credentials or server error');
        } else {
            setError('Login failed: Invalid credentials');
        }
    };

    return (
        <div>  
            <div className="auth-page">
                {/* <ThemeToggle />           */}
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    <label>
                        Log In
                    </label>
                    <label>
                        Email:
                        <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <label>
                        Password:
                        <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default UserLoginForm;
// Ensure no code exists below this line