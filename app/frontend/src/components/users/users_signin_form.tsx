//===========================================================
//  
//  users_signin_form.tsx
//  Form component for new user account registration.
//  
//============================================================
import React from 'react';

// ---------------------------------------------------------------------
//   Helper function to send registration data to the backend.
// -------------------------------------------------------------------
const signInUser = async (user: { name: string; email: string; password: string }) => {
    console.log("Signing in user:", user);
    try {
        const API_URL = `http://${window.location.hostname}:8000/signin`;
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }   

        const data = await response.json();
        console.log("User signed in successfully:", data);
        return data;
    } catch (error) {
        console.error("Error sending user data:", error);
        return null;
    }
}

// ---------------------------------------------------------------------
//   UserSigninForm component definition.
// -------------------------------------------------------------------
const UserSignInForm: React.FC = () => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');

    // Demonstrating useEffect: runs when the sign-in form is shown
    React.useEffect(() => {
        console.log("Sign-in form module initialized");
    }, []);

    // ---------------------------------------------------------------------
    //   Handles the form submission for creating a new user.
    // -------------------------------------------------------------------
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name || !email || !password) {
            setMessage("Please fill all fields");
            return;
        }
        
        setIsLoading(true);
        const result = await signInUser({ name, email, password });
        setIsLoading(false);

        if (result) {
            setMessage("Account created! You can now log in.");
            setName('');
            setEmail('');
            setPassword('');
        } else {
            setMessage("Sign-in failed. Email might already be registered.");
        }
    };
    return (
        <form onSubmit={handleSubmit}>
            {message && <div style={{ marginBottom: '1rem', color: 'var(--user-text-main)' }}>{message}</div>}
            <label>
                Sign In
            </label>
            <label>
                Name:
                <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
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
                {isLoading ? "Saving..." : "Submit"}
            </button>
        </form>
    );
}
export default UserSignInForm;