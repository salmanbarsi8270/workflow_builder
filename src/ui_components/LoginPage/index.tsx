import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "../api/apiurl";
import { useUser } from '../../context/UserContext';
import axios from 'axios';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, register, user } = useUser();

    useEffect(() => {
        // Redirect if user is already logged in
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Redirect to Backend Login Endpoint
        window.location.href = `${API_URL}/auth/login`;
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isSignUp) {
                await register(email, password, name);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || `Invalid ${isSignUp ? 'registration' : 'credentials'}`);
            } else {
                setError('An unexpected error occurred');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 px-4">
            <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-border/50">
                <CardHeader className="text-center space-y-2 pb-8">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-8 ring-primary/5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-7 w-7 text-primary"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                        {isSignUp 
                            ? "Join us to start building your workflows" 
                            : "Sign in to your account to continue building workflows"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11 px-4 focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="test@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 px-4 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 px-4 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                       
                        {error && (
                            <p className="text-sm font-medium text-destructive text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {isSignUp ? "Creating account..." : "Signing in..."}
                                </span>
                            ) : (
                                isSignUp ? "Sign Up" : "Sign In"
                            )}
                        </Button>

                        <div className="text-center text-sm">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary hover:underline font-medium"
                            >
                                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                            </button>
                        </div>

                        {!isSignUp && (
                            <div className="pt-1 text-center">
                                <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Development Credentials</p>
                                <p className="text-xs text-muted-foreground italic">test@example.com / Admin@1234</p>
                            </div>
                        )}
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-11 text-base font-medium relative hover:bg-muted/50 transition-colors border-border/60"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 12.01-2.09 15.61-5.67l-7.73-6c-2.15 1.45-4.92 2.3-7.88 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            </svg>
                            <span>Google</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
