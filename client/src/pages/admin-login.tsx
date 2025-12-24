import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = "/admin";
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  return (
    <div className="min-h-screen bg-gradient-to-b from-darker-bg via-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold-primary/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-gold-primary">Admin Login</CardTitle>
          <CardDescription>
            Access the Diaa Eldeen admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-600/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@diaaldeen.com"
                value={email}
                onChange={handleEmailChange}
                required
                disabled={isLoading}
                className="border-gold-primary/30 focus:border-gold-primary"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
                className="border-gold-primary/30 focus:border-gold-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-background hover:from-gold-secondary hover:to-neon-pink"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-4">
            <Button onClick={() => window.location.href = "/qr/login"} className="w-full">Login with QR</Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Protected admin area. Unauthorized access is prohibited.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
