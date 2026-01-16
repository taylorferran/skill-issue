import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui';
import './Login.styles.css';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleLogin = () => {
    navigate('/sign-in');
  };

  return (
    <div className="loginContainer">
      <div className="loginContent">
        <div className="loginHeader">
          <h1>Welcome to Skill Issues</h1>
          <p>Your AI-powered learning platform</p>
        </div>
        
        <div className="loginButtonContainer">
          <Button 
            variant="primary" 
            size="large"
            onClick={handleLogin}
            className="loginButton"
          >
            Sign In to Continue
          </Button>
        </div>
        
        <div className="loginFeatures">
          <div className="feature">
            <span className="featureIcon">🚀</span>
            <span>AI-powered learning experiences</span>
          </div>
          <div className="feature">
            <span className="featureIcon">📚</span>
            <span>Multiple programming languages</span>
          </div>
          <div className="feature">
            <span className="featureIcon">🎯</span>
            <span>Personalized learning paths</span>
          </div>
        </div>
      </div>
    </div>
  );
}
