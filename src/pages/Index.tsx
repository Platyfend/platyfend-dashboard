
import { useState } from "react";
import { Github, GitBranch, Cloud, Square, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [selectedOption, setSelectedOption] = useState<'saas' | 'self-hosted'>('saas');

  const authProviders = [
    {
      name: "Continue with GitHub",
      icon: Github,
      onClick: () => console.log("GitHub login"),
      color: "hover:text-gray-900 hover:bg-gray-50"
    },
    {
      name: "Continue with GitLab",
      icon: GitBranch,
      onClick: () => console.log("GitLab login"),
      color: "hover:text-orange-600 hover:bg-orange-50"
    },
    {
      name: "Continue with Azure DevOps",
      icon: Cloud,
      onClick: () => console.log("Azure DevOps login"),
      color: "hover:text-blue-600 hover:bg-blue-50"
    },
    {
      name: "Continue with Bitbucket",
      icon: Square,
      onClick: () => console.log("Bitbucket login"),
      color: "hover:text-blue-700 hover:bg-blue-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-50 via-platyfend-50 to-midnight-100 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-platyfend-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-midnight-200/20 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-platyfend-100/10 via-transparent to-midnight-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-platyfend-500 to-platyfend-700 flex items-center justify-center mr-4 shadow-xl shadow-platyfend-500/25 animate-glow">
                  <img 
                    src="/lovable-uploads/09d1c7c0-5887-481f-8b68-da510e8246f7.png" 
                    alt="Platyfend Logo" 
                    className="w-10 h-10 brightness-0 invert"
                  />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-midnight-900 tracking-tight">Platyfend</h1>
                <div className="flex items-center text-sm text-platyfend-600 font-medium mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  <span>Secure AI Code Review</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-10">
              <h2 className="text-2xl font-semibold text-midnight-800 tracking-tight">
                Welcome back
              </h2>
              <p className="text-midnight-600 font-medium">
                Sign in to your secure development environment
              </p>
            </div>

            {/* Enhanced SaaS / Self-Hosted Toggle */}
            <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 mb-8 shadow-lg border border-white/20">
              <div className="flex relative">
                <div 
                  className={`absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-md transition-all duration-300 ease-out ${
                    selectedOption === 'saas' ? 'left-1.5 right-1/2 mr-0.5' : 'right-1.5 left-1/2 ml-0.5'
                  }`}
                ></div>
                <button
                  onClick={() => setSelectedOption('saas')}
                  className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedOption === 'saas'
                      ? 'text-platyfend-700 z-10'
                      : 'text-midnight-600 hover:text-midnight-800'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Cloud SaaS</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedOption('self-hosted')}
                  className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedOption === 'self-hosted'
                      ? 'text-platyfend-700 z-10'
                      : 'text-midnight-600 hover:text-midnight-800'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Self-Hosted</span>
                  </div>
                </button>
              </div>
              
              {/* Tab descriptions */}
              <div className="mt-3 text-xs text-midnight-500 font-medium">
                {selectedOption === 'saas' 
                  ? 'Managed cloud platform with enterprise security' 
                  : 'Deploy on your infrastructure with full control'
                }
              </div>
            </div>
          </div>

          {/* Enhanced Authentication Card */}
          <Card className="border-0 shadow-2xl shadow-midnight-900/5 bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="space-y-3">
                {authProviders.map((provider, index) => (
                  <Button
                    key={provider.name}
                    onClick={provider.onClick}
                    variant="outline"
                    className={`w-full py-6 px-6 text-left justify-start text-midnight-700 border-midnight-200/50 bg-white/50 backdrop-blur-sm hover:border-platyfend-300 hover:bg-white hover:shadow-lg transition-all duration-300 group rounded-2xl font-medium ${provider.color} transform hover:scale-[1.02] hover:-translate-y-0.5`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <provider.icon className="w-5 h-5 mr-4 text-midnight-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="flex-1">{provider.name}</span>
                    <ArrowRight className="w-4 h-4 text-midnight-400 group-hover:text-platyfend-600 group-hover:translate-x-1 transition-all duration-300" />
                  </Button>
                ))}
              </div>

              {/* Enhanced Sign Up Section */}
              <div className="relative mt-8 pt-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-midnight-300 to-transparent"></div>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-midnight-600 font-medium">
                    New to Platyfend?
                  </p>
                  <Button 
                    onClick={() => console.log("Sign up clicked")}
                    className="bg-gradient-to-r from-platyfend-600 to-platyfend-700 hover:from-platyfend-700 hover:to-platyfend-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-platyfend-600/25 hover:shadow-xl hover:shadow-platyfend-600/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
                  >
                    <span>Create your account</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Legal Text */}
              <div className="text-center mt-8 pt-6 border-t border-midnight-200/30">
                <p className="text-xs text-midnight-500 leading-relaxed font-medium">
                  By continuing, you agree to our{" "}
                  <button 
                    onClick={() => console.log("Terms clicked")}
                    className="text-platyfend-600 hover:text-platyfend-700 hover:underline transition-colors underline-offset-2 font-semibold"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button 
                    onClick={() => console.log("Privacy clicked")}
                    className="text-platyfend-600 hover:text-platyfend-700 hover:underline transition-colors underline-offset-2 font-semibold"
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Footer */}
          <div className="text-center mt-10">
            <div className="inline-flex items-center space-x-2 text-sm text-midnight-600 font-medium bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Shield className="w-4 h-4 text-platyfend-600" />
              <span>
                {selectedOption === 'saas' 
                  ? 'Enterprise-grade security with 99.9% uptime' 
                  : 'Complete control over your code review infrastructure'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
