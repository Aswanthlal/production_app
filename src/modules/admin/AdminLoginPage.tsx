import React, { useState } from "react";
import { ArrowLeft, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface AdminLoginPageProps {
  onBack: () => void;
  onSuccess: (username: string) => void;
}

export default function AdminLoginPage({
  onBack,
  onSuccess,
}: AdminLoginPageProps) {
  const { loginAdmin } = useStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const ok = loginAdmin(username, password);
      setIsLoading(false);
      if (ok) {
        onSuccess(username);
      } else {
        setErrorMsg("Invalid credentials. Try using admin / admin123");
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername("admin");
    setPassword("admin123");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-stone-200 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-700/20">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Store Admin Portal
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Sign in with authorized administrator credentials to manage categories, products, inventory, and pricing.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Username"
            required
            leftIcon={<User className="w-4 h-4" />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Password"
            required
            type={showPassword ? "text" : "password"}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In as Admin
          </Button>
        </form>

        {/* Demo Quick-Fill Helper */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-400">Demo login?</span>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fill admin / admin123</span>
          </button>
        </div>
      </div>
    </div>
  );
}
