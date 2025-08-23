import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-6">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
        
        <p className="text-gray-600 mb-8">
          Vous n'avez pas la permission d'accéder à cette page. Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        
        <Link to="/dashboard">
          <Button className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default Unauthorized;