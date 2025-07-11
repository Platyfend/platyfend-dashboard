
import { useState } from "react";
import { Github, GitBranch, Cloud, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [selectedOption, setSelectedOption] = useState<'saas' | 'self-hosted'>('saas');

  const authProviders = [
    {
      name: "Login with GitHub",
      icon: Github,
      onClick: () => console.log("GitHub login")
    },
    {
      name: "Login with GitLab",
      icon: GitBranch,
      onClick: () => console.log("GitLab login")
    },
    {
      name: "Login with Azure DevOps",
      icon: Cloud,
      onClick: () => console.log("Azure DevOps login")
    },
    {
      name: "Login with Bitbucket Cloud",
      icon: Square,
      onClick: () => console.log("Bitbucket login")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-platyfend-600 flex items-center justify-center mr-3">
              <img 
                src="/lovable-uploads/09d1c7c0-5887-481f-8b68-da510e8246f7.png" 
                alt="Platyfend Logo" 
                className="w-8 h-8 invert"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Platyfend</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Welcome to Platyfend
          </h2>

          {/* SaaS / Self-Hosted Toggle */}
          <div className="flex bg-gray-200 rounded-full p-1 mb-8">
            <button
              onClick={() => setSelectedOption('saas')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedOption === 'saas'
                  ? 'bg-platyfend-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              SaaS
            </button>
            <button
              onClick={() => setSelectedOption('self-hosted')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedOption === 'self-hosted'
                  ? 'bg-platyfend-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Self-Hosted
            </button>
          </div>
        </div>

        {/* Authentication Buttons */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-4">
              {authProviders.map((provider, index) => (
                <Button
                  key={provider.name}
                  onClick={provider.onClick}
                  variant="outline"
                  className="w-full py-6 text-left justify-start text-gray-700 border-gray-200 hover:border-platyfend-300 hover:bg-platyfend-50 transition-all duration-200 group"
                >
                  <provider.icon className="w-5 h-5 mr-3 text-gray-600 group-hover:text-platyfend-600" />
                  {provider.name}
                </Button>
              ))}
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button 
                  onClick={() => console.log("Sign up clicked")}
                  className="text-platyfend-600 hover:text-platyfend-700 font-medium hover:underline transition-colors"
                >
                  Sign up here.
                </button>
              </p>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                By continuing, you agree to the{" "}
                <button 
                  onClick={() => console.log("Terms clicked")}
                  className="text-platyfend-600 hover:underline"
                >
                  Terms of Use
                </button>{" "}
                and{" "}
                <button 
                  onClick={() => console.log("Privacy clicked")}
                  className="text-platyfend-600 hover:underline"
                >
                  Privacy Policy
                </button>{" "}
                applicable to Platyfend
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            {selectedOption === 'saas' 
              ? 'Secure cloud-based code review platform' 
              : 'Deploy on your own infrastructure'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
