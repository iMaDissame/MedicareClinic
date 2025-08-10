import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, Heart, Sparkles, UserCheck, Calendar, ChevronRight, 
  CheckCircle, Menu, X, Play, Clock, Star,  BookOpen, Zap, Users, Award, Droplets
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<{name: string, email: string, message: string}>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  type ModuleType = {
    id: number;
    title: string;
    isAvailable: boolean;
    duration: string;
    level: string;
    description: string;
    content: {
      sections: { title: string; content: string }[];
    };
    launchDate?: string;
  };
  
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

  // References to sections for smooth scrolling
  const featuresRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Testimonial data
  const testimonials = [
    {
      "name": "Asmaa Messaoudi",
      "review": "Je recommande fortement. Je me prépare chaque été chez Medicare Clinic. Je m'offre des packs d'amincissement pour affiner et remodeler mon corps. C'est ma troisième année chez eux. Toujours professionnelles et accueillantes. Et le résultat est toujours là ! Très très satisfaite."
    },
    {
      "name": "Oumaima Deroui",
      "review": "Je félicite Mme Ghizlane pour le service incroyable, je suis très ravie du résultat après le traitement hydrafacial, car il m'a donné un éclat parfait et aussi une peau douce, alors merci pour tout cela."
    },
    {
      "name": "Imane El Kouzoudi",
      "review": "Je fais mes traitements chez Medicare depuis 3 mois maintenant et je ne peux que féliciter le propriétaire et l'équipe pour la qualité du service et de l'hospitalité. Ghizlane sait très bien ce qu'elle fait et elle a le personnel le plus gentil. Je suis plus que satisfaite du résultat, je recommande vivement !"
    },
    {
      "name": "Aya Lemnaoure",
      "review": "Très satisfaite 💖💖🌹 Un grand merci à Mme Ghizlane et Fatima Zahrae 🌹"
    },
    {
      "name": "Malak Aboutaib",
      "review": "Franchement, super expérience pour le laser ! Les résultats sont au rendez-vous, je vois une vraie différence. Les filles sont adorables, toujours souriantes et très pro. L'ambiance est chaleureuse, on se sent vite en confiance. Je recommande à 100 % 👏🏻👌🏻"
    },
    {
      "name": "Ichrak Gaougaou",
      "review": "Après avoir vécu une belle expérience au sein de la clinique Médicale, la seule chose que je peux dire c'est que je suis très satisfait de tous les résultats. Ce fut un plaisir de voir des femmes comme la propriétaire de l'entreprise aimer leur travail et bénéficier de services de bonne qualité. Merci"
    },
    {
      "name": "Ilham Kalila",
      "review": "J'ai eu une expérience exceptionnelle au centre Medicare pour un soin Hydrafacial. Le soin était tout simplement top, et les résultats sont visibles dès la première séance. L'équipe est incroyablement gentille, souriante et très professionnelle. Le centre est propre, moderne et équipé des dernières technologies pour offrir les meilleurs soins. Un grand merci à Madame Ghizlane pour ce magnifique centre où l'on se sent entre de bonnes mains. Je recommande vivement."
    },
    {
      "name": "Khawla Hamim",
      "review": "Toooop j'ai beaucoup aimé le résultat. Mme Ghizlane est très sympa. J'ai fait le peeling, zina incroyable la différence. Je termine aussi mes séances de laser 🙈❤️❤️"
    },
    {
      "name": "Nadia Aitoumajjoud",
      "review": "Que Dieu vous bénisse, si Dieu le veut, vous obtenez des résultats étonnants dès la première séance, et la différence est nette en ce qui concerne le « soin hydrafacial ». Traitement classe, bon accueil et grande humilité de la part du Dr Ghazlan. Je vous souhaite du succès, si Dieu le veut."
    },
    {
      "name": "Oumaima Elfaz",
      "review": "Très satisfaite de mon expérience chez Medicare Clinic, 2ème soin hydrafacial effectué par Mme Ghizlane toujours avec autant de professionnalisme, de bienveillance et d'écoute. Ghizlane fait tout pour votre bien-être et que le soin soit un moment de plaisir et de détente. Ce soin a été vraiment un moment de décompression totale et de lâcher-prise sous ses mains douces et expertes."
    },
    {
      "name": "Raby El",
      "review": "The Best, franchement toutes les prestations sont au top. Moi j'ai fais le laser, l'amincissement, le lifting... et je suis satisfaite. Les filles sont aimables, elles prennent leur travail à cœur. Bon courage et bonne continuation."
    }
  ];

  // Auto-scroll for testimonials with seamless infinite loop
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let isUserScrolling = false;
    let scrollTimeout: number;
    
    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // space-x-6 = 24px
    const scrollAmount = cardWidth + gap;
    const totalCards = testimonials.length;
    const containerWidth = totalCards * scrollAmount;

    const smoothScroll = () => {
      if (!isUserScrolling && scrollContainer) {
        const currentScroll = scrollContainer.scrollLeft;
        const maxScroll = containerWidth;
        
        // When we reach the end of the original testimonials, seamlessly jump to start
        if (currentScroll >= maxScroll) {
          scrollContainer.scrollLeft = 0;
        } else {
          scrollContainer.scrollLeft = currentScroll + 1;
        }
      }
      animationId = requestAnimationFrame(smoothScroll);
    };

    const handleUserScroll = () => {
      isUserScrolling = true;
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 3000);
    };

    scrollContainer.addEventListener('scroll', handleUserScroll);
    smoothScroll();

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(scrollTimeout);
      scrollContainer?.removeEventListener('scroll', handleUserScroll);
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      message: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Le nom est requis";
      isValid = false;
    }

    // No email validation required, allow empty email

    if (!formData.message.trim()) {
      errors.message = "Le message est requis";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Add this useEffect for resetting the form after showing the success message
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
      }, 10000); // 10 seconds
    
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Stop the form submission if validation fails
    }
    
    setIsSubmitting(true);
    
    // Construct the WhatsApp message with form data
    const message = `*Nouvelle demande de formation*\n\n` +
      `*Nom:* ${formData.name}\n` +
      `*Email:* ${formData.email ? formData.email : 'Non fourni'}\n` +
      `*Téléphone:* ${formData.phone || 'Non fourni'}\n` +
      `*Type de formation:* ${selectedFormation}\n\n` +
      `*Message:* ${formData.message}`;
      
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // WhatsApp API URL with your business phone number
    const whatsappURL = `https://wa.me/212661280787?text=${encodedMessage}`;
    
    // Redirect to WhatsApp after a short delay
    setTimeout(() => {
      window.open(whatsappURL, '_blank');
      
      // Reset form and show confirmation message
      setFormData({ name: '', email: '', phone: '', message: '' });
      setIsSubmitting(false);
      setSubmitted(true);
      
      // Form will automatically reset after 10 seconds due to the useEffect
    }, 500);
  };

  // Formation types with animations
  const formationTypes = [
    {
      title: "Théorie + Pratique",
      description: "Formation complète alliant théorie et ateliers pratiques en clinique.",
      icon: BookOpen,
      gradient: "from-pink-400 to-rose-500",
      features: ["Cours théoriques complets", "Ateliers pratiques", "Suivi personnalisé", "Certification"]
    },
    {
      title: "Théorie uniquement", 
      description: "Accès à tout le contenu théorique en ligne, à votre rythme.",
      icon: Users,
      gradient: "from-purple-400 to-pink-500",
      features: ["Plateforme en ligne", "Contenu multimédia", "Accès illimité", "Explications détaillées"]
    },
    {
      title: "Pratique uniquement",
      description: "Sessions pratiques intensives en clinique avec nos experts.",
      icon: Zap,
      gradient: "from-rose-400 to-orange-500", 
      features: ["Sessions intensives", "Équipement professionnel", "Experts dédiés", "Mise en situation"]
    }
  ];

  // Services offered at the clinic
  const clinicServices = [
    {
      title: "Soins du Visage Avancés",
      description: "Traitements professionnels pour améliorer la qualité et l'apparence de votre peau avec les dernières technologies.",
      icon: Sparkles,
      gradient: "from-pink-400 to-rose-400",
      services: ["Hydrafacial", "Carbon Peel", "Microneedling", "Radiofréquence fractionnée"]
    },
    {
      title: "Traitements Anti-Âge",
      description: "Solutions non-invasives pour réduire les signes du vieillissement et raffermir votre peau.",
      icon: Heart,
      gradient: "from-purple-400 to-pink-400",
      services: ["HIFU Visage", "HIFU Double Menton", "HIFU Vaginal", "Lifting non-chirurgical"]
    },
    {
      title: "Épilation & Détatouage Laser",
      description: "Technologies laser de pointe pour l'épilation permanente et le détatouage sécurisé.",
      icon: Zap,
      gradient: "from-rose-400 to-orange-400",
      services: ["Épilation Laser", "Détatouage", "Laser Alexandrite", "Laser Diode"]
    },
    {
      title: "Soins Capillaires PRP",
      description: "Traitement révolutionnaire au Plasma Riche en Plaquettes pour stimuler la croissance des cheveux.",
      icon: Droplets,
      gradient: "from-emerald-400 to-teal-400",
      services: ["PRP Cheveux", "Stimulation folliculaire", "Traitement chute", "Régénération capillaire"]
    },
    // {
    //   title: "Services Beauté",
    //   description: "Prestations complètes de beauté pour sublimer votre look avec expertise et professionnalisme.",
    //   icon: Scissors,
    //   gradient: "from-amber-400 to-orange-400",
    //   services: ["Onglerie", "Extensions de cils", "Rehaussement de cils", "Nail Art"]
    // },
    // {
    //   title: "Médecine Alternative",
    //   description: "Techniques traditionnelles de bien-être intégrées dans un cadre médical moderne.",
    //   icon: Shield,
    //   gradient: "from-indigo-400 to-purple-400",
    //   services: ["Hijama (Cupping)", "Soins holistiques", "Bien-être", "Détoxification"]
    // }
  ];

  const handleFormationTypeClick = (e: React.MouseEvent, formationType: string) => {
    e.stopPropagation();
    setSelectedFormation(formationType);
    scrollToSection(contactRef);
  };

  // Available modules
  const availableModules = [
    {
      id: 1,
      title: "Traitement de la peau",
      isAvailable: true,
      duration: "4h",
      level: "Intermédiaire",
      description: "Techniques avancées pour améliorer la qualité et l'apparence de la peau.",
      content: {
        sections: [
          {
            title: "Hydrafacial + Carbon Peel",
            content: "Cette combinaison innovante permet de nettoyer en profondeur, d'hydrater et d'exfolier la peau. Les participants découvriront les bienfaits de l'hydrafacial pour revitaliser la peau, ainsi que l'utilisation du carbon peel pour atténuer les imperfections et les signes de vieillissement."
          },
          {
            title: "Microneedling",
            content: "Ce traitement favorise la régénération cutanée en stimulant la production de collagène. La formation inclura des démonstrations de la technique, ainsi que des conseils sur les soins post-traitement pour maximiser les résultats."
          },
          {
            title: "Radiofréquence fractionnée",
            content: "Les participants exploreront cette méthode non invasive, qui utilise des ondes radio pour resserrer la peau et améliorer sa texture. Le module couvrira les indications, contre-indications, et les différents types d'appareils utilisés dans le cadre de ces traitements."
          }
        ]
      }
    },
    {
      id: 2,
      title: "Anti-Âge",
      isAvailable: true,
      duration: "3h",
      level: "Avancé",
      description: "Techniques visant à réduire les signes du vieillissement et améliorer l'apparence de la peau.",
      content: {
        sections: [
          {
            title: "HIFU Visage et Double Menton",
            content: "Ce traitement non invasif utilise l'ultrason focalisé de haute intensité (HIFU) pour stimuler le collagène et raffermir la peau du visage et du double menton. Les participants apprendront les protocoles de traitement, les zones ciblées et les résultats attendus, ainsi que les soins post-traitement."
          },
          {
            title: "HIFU Vaginal",
            content: "Ce traitement permet de revitaliser la zone intime féminine en utilisant la technologie HIFU pour améliorer l'élasticité et la fermeté. Le module inclura des discussions sur les indications, les bénéfices, et les précautions à prendre pour garantir un traitement sûr et efficace."
          }
        ]
      }
    },
    {
      id: 3,
      title: "Épilation Laser",
      isAvailable: true,
      duration: "5h",
      level: "Intermédiaire",
      description: "Techniques d'épilation permanente par laser avec compréhension des procédures et meilleures pratiques.",
      content: {
        sections: [
          {
            title: "Principes de l'Épilation Laser",
            content: "Introduction à la technologie laser, incluant le fonctionnement des lasers (comme le laser Alexandrite et le laser diode) et leur interaction avec la mélanine dans les poils. Les participants apprendront comment la lumière laser ciblée détruit le follicule pileux tout en préservant la peau environnante."
          },
          {
            title: "Protocoles de Traitement",
            content: "Les étapes essentielles pour effectuer un traitement d'épilation laser en toute sécurité, y compris : évaluation de la peau et des poils des clients, préparation de la zone à traiter, réglages des paramètres du laser en fonction du type de peau et de poil."
          },
          {
            title: "Sécurité et Contre-indications",
            content: "Identification des situations où l'épilation laser ne pourrait pas être recommandée, telles que les maladies cutanées actives ou l'utilisation de médicaments photosensibilisants. Les participants apprendront également les moyens de minimiser les effets secondaires potentiels."
          }
        ]
      }
    },
    {
      id: 4,
      title: "Détatouage",
      isAvailable: true,
      duration: "3h",
      level: "Avancé",
      description: "Techniques de détatouage pour réduire ou enlever des tatouages de manière sûre et efficace.",
      content: {
        sections: [
          {
            title: "Principes du Détatouage",
            content: "Comprendre les méthodes de détatouage courantes, notamment le détatouage au laser, qui utilise des impulsions de lumière pour fragmenter les pigments du tatouage. Les participants découvriront également d'autres approches comme les solutions chimiques et les techniques chirurgicales."
          },
          {
            title: "Techniques de Détatouage au Laser",
            content: "Protocoles de Traitement : Étapes à suivre pour réaliser un traitement, y compris la préparation de la peau, le réglage des paramètres du laser, et l'administration du traitement."
          }
        ]
      }
    },
    {
      id: 5,
      title: "PRP Cheveux",
      isAvailable: true,
      duration: "2h",
      level: "Intermédiaire",
      description: "Traitement PRP (Plasma Riche en Plaquettes) pour stimuler la croissance capillaire.",
      content: {
        sections: [
          {
            title: "Introduction au PRP",
            content: "Présentation du PRP, ses caractéristiques, et principes de fonctionnement. Le PRP est un plasma autologue enrichi en plaquettes, riche en facteurs de croissance favorisant la régénération et la croissance des tissus, notamment des follicules pileux."
          },
          {
            title: "Indications et bénéfices",
            content: "Traitement contre la chute de cheveux légère à modérée, stimulation de la repousse, amélioration de l'épaisseur et de la qualité du cheveu, notamment pour des alopécies androgéniques."
          },
          {
            title: "Étapes pratiques",
            content: "Prélèvement sanguin du patient, centrifugation pour séparer le plasma riche en plaquettes, injection du PRP dans le cuir chevelu avec des micro-aiguilles en différents points ciblés."
          }
        ]
      }
    }
  ];

  // Upcoming modules
  const upcomingModules = [
    {
      id: 6,
      title: "Onglerie",
      isAvailable: false,
      duration: "6h",
      level: "Débutant",
      launchDate: "Mars 2025",
      description: "Formation complète en prothésie ongulaire, nail art et soins des mains.",
      content: {
        sections: [
          {
            title: "Introduction et connaissances de base",
            content: "Présentation de la formation, objectifs, anatomie de l'ongle, composition, cycle de croissance, anomalies et maladies courantes. Notions d'hygiène, désinfection du matériel, risques professionnels."
          },
          {
            title: "Matériel et préparation",
            content: "Présentation des outils et produits utilisés en onglerie. Préparation de l'ongle naturel : limage, repoussage des cuticules, petite manucure."
          },
          {
            title: "Techniques de pose et façonnage",
            content: "Pose de vernis régulier, semi-permanent, french manucure. Techniques de pose gel, résine acrylique et acrygel."
          },
          {
            title: "Nail art et décoration",
            content: "Techniques de décoration d'ongles : dessins, motifs, strass, paillettes. Utilisation des outils spécifiques."
          }
        ]
      }
    },
    {
      id: 7,
      title: "Formation Cils",
      isAvailable: false,
      duration: "4h",
      level: "Intermédiaire",
      launchDate: "Avril 2025",
      description: "Techniques d'extension et rehaussement de cils, spécialiste du regard.",
      content: {
        sections: [
          {
            title: "Introduction au métier",
            content: "Présentation du métier de technicien(ne) cil à cil et spécialiste du regard. Anatomie des cils et regard : comprendre la structure, cycle de croissance, et précautions."
          },
          {
            title: "Hygiène et sécurité",
            content: "Protocoles de désinfection du matériel et hygiène en salon. Prévention des allergies, contre-indications et sécurité client."
          },
          {
            title: "Techniques d'extension de cils",
            content: "Types d'extensions (classiques, volume russe, hybride). Choix des matériaux : types de cils synthétiques, longueur, courbure."
          },
          {
            title: "Techniques de rehaussement de cils",
            content: "Procédé de rehaussement : déroulement, produits utilisés. Techniques de teinture des cils et soins complémentaires."
          }
        ]
      }
    },
    {
      id: 8,
      title: "Formation Hijama",
      isAvailable: false,
      duration: "3h",
      level: "Débutant",
      launchDate: "Mai 2025",
      description: "Introduction à la Hijama (cupping), techniques de base et sécurité.",
      content: {
        sections: [
          {
            title: "Introduction rapide",
            content: "Qu'est-ce que la Hijama (cupping) ? Bienfaits principaux et indications courantes."
          },
          {
            title: "Matériel de base",
            content: "Ventouses simples : types et utilisation. Règles d'hygiène faciles à appliquer."
          },
          {
            title: "Anatomie et zones d'application",
            content: "Localisation simple des points principaux (zones dos, bras, jambes). Comprendre où poser les ventouses sans entrer dans le détail des méridiens."
          },
          {
            title: "Techniques de base",
            content: "Hijama sèche (sans saignée) : pose et retrait des ventouses. Durée moyenne et sensations possibles. Précautions élémentaires."
          }
        ]
      }
    }
  ];

  const openModuleModal = (module: unknown) => {
    setSelectedModule(module as ModuleType);
    setIsModuleModalOpen(true);
  };

  const closeModuleModal = () => {
    setIsModuleModalOpen(false);
    setSelectedModule(null);
  };

  // Options de formation
  const formationOptions = [
    "Théorie + Pratique",
    "Théorie uniquement", 
    "Pratique uniquement"
  ];

  const [selectedFormation, setSelectedFormation] = useState(formationOptions[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center mt-6">
              <img 
                src="aa.png" 
                alt="Logo Medicare Clinic" 
                className="h-24 md:h-28 lg:h-32 w-auto object-contain my-2" 
              />
            </div>
            {/* Navigation bureau */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection(featuresRef)} className="text-gray-700 hover:text-pink-600 font-medium">Formations</button>
              <button onClick={() => scrollToSection(servicesRef)} className="text-gray-700 hover:text-pink-600 font-medium">Services</button>
              <button onClick={() => scrollToSection(testimonialsRef)} className="text-gray-700 hover:text-pink-600 font-medium">Témoignages</button>
              <button onClick={() => scrollToSection(contactRef)} className="text-gray-700 hover:text-pink-600 font-medium">Contact</button>
            </div>
            <div className="hidden md:flex space-x-4">
              <Link to="/login" 
                className="w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Voir les cours
              </Link>
            </div>
            {/* Menu mobile */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-pink-50"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-pink-100 py-4 px-4">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Formations
              </button>
              <button 
                onClick={() => scrollToSection(servicesRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection(testimonialsRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Témoignages
              </button>
              <button 
                onClick={() => scrollToSection(contactRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Contact
              </button>
              <hr className="border-pink-100 my-2" />
              <div className="flex">
                <Link to="/login" 
                  className="w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Voir les cours
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
        
      {/* Section Héro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Rejoignez l'Académie Clinique Esthétique pour des Formations d'Excellence
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Découvrez notre plateforme de formation en ligne dédiée à la médecine esthétique : soins du visage, lasers, PRP, microneedling et bien plus.
          </p>
          <div className="flex space-x-4">
            <Link to="/login" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center">
            Commencer <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
            <button 
              onClick={() => scrollToSection(featuresRef)} 
              className="flex items-center text-pink-600 font-medium hover:underline"
            >
              En savoir plus <ChevronRight className="ml-1 h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="md:w-1/2 relative">
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg overflow-hidden shadow-xl transform -rotate-2">
            <img src="https://img.freepik.com/free-photo/beauty-concept-beautiful-caucasian-woman-with-clean-skin-natural-make-up-isolated-bright-pink-background-with-copy-space_1258-1031.jpg?semt=ais_hybrid&w=740" alt="Formation esthétique" className="w-full h-auto opacity-90" />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white rounded-lg p-4 shadow-lg">
            <p className="font-medium text-gray-900">Rejoignez notre Académie Clinique Esthétique</p>
            <div className="flex mt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-pink-300 border-2 border-white flex items-center justify-center text-white text-xs">
                    {i}
                  </div>
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-600">
                <div className="font-medium">Formations 5 étoiles</div>
                <div>pour professionnels</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section Formations */}
      <section id="features" ref={featuresRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Formation en médecine esthétique</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              3 options de formation réservées à nos clients :
            </p>
          </div>
          
          {/* Animated Formation Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {formationTypes.map((type, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" 
                     style={{background: `linear-gradient(to bottom right, rgb(236 72 153), rgb(239 68 68))`}}></div>
                
                <div className={`bg-gradient-to-r ${type.gradient} w-16 h-16 rounded-full flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  <type.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                  {type.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {type.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-pink-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="text-center">
                  <button 
                    onClick={(e) => handleFormationTypeClick(e, type.title)}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
                  >
                    Choisir cette formation
                  </button>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>

          {/* Available Modules */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Modules Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableModules.map((module) => (
                <div 
                  key={module.id}
                  onClick={() => openModuleModal(module)}
                  className="group bg-white rounded-xl p-6 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      Disponible
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{module.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {module.duration}
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {module.level}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button className="text-green-600 font-medium text-sm hover:text-green-700 transition-colors flex items-center mx-auto">
                      Voir le contenu <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Modules */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Modules à Venir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingModules.map((module) => (
                <div 
                  key={module.id}
                  onClick={() => openModuleModal(module)}
                  className="group bg-white rounded-xl p-6 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
                  
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                    Bientôt
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 w-12 h-12 rounded-lg flex items-center justify-center shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-700 mb-2 group-hover:text-orange-600 transition-colors">{module.title}</h4>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {module.duration}
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {module.level}
                    </div>
                  </div>
                  
                  <div className="text-xs text-orange-600 font-medium mb-4">
                    {/* Lancement prévu : {module.launchDate} */}
                  </div>
                  
                  <div className="text-center">
                    <button className="text-orange-600 font-medium text-sm hover:text-orange-700 transition-colors flex items-center mx-auto">
                      Aperçu du contenu <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section id="services" ref={servicesRef} className="py-16 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Services en Clinique</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Découvrez nos traitements esthétiques professionnels dans notre clinique à Marrakech
            </p>
          </div>
          
          {/* Change grid-cols-3 to grid-cols-4 for larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {clinicServices.map((service, index) => (
              <div key={index} className="group bg-white rounded-xl p-5 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-500 border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" 
                    style={{background: `linear-gradient(to bottom right, rgb(236 72 153), rgb(239 68 68))`}}></div>
                
                <div className={`bg-gradient-to-r ${service.gradient} w-10 h-10 rounded-full flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="h-5 w-5 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {service.description}
                </p>
                
                <ul className="space-y-1.5">
                  {service.services.map((item, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="h-3.5 w-3.5 text-pink-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Module Modal */}
      {isModuleModalOpen && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${selectedModule.isAvailable ? 'bg-gradient-to-r from-pink-400 to-rose-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'} w-12 h-12 rounded-full flex items-center justify-center mr-4`}>
                    {selectedModule.isAvailable ? (
                      <Play className="h-6 w-6 text-white" />
                    ) : (
                      <Clock className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedModule.title}</h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {selectedModule.duration}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        {selectedModule.level}
                      </span>
                      {selectedModule.isAvailable ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Disponible
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          Bientôt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModuleModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">{selectedModule.description}</p>
              
              <div className="space-y-6">
                {selectedModule.content.sections.map((section: { title: string; content: string }, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="bg-pink-100 text-pink-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      {section.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                {selectedModule.isAvailable ? (
                  <Link to="/login" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium inline-block">
                    Commencer ce module
                  </Link>
                ) : (
                  <button className="bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed font-medium">
                    Bientôt Disponible
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Témoignages avec scroll horizontal seamless */}
      <section id="testimonials" ref={testimonialsRef} className="py-16 bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Témoignages de nos clients</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Découvrez ce que nos clients disent de leur expérience chez Medicare Clinic
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto scrollbar-hide space-x-6 pb-4" 
              style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
            >
              {/* Original testimonials */}
              {testimonials.map((testimonial, index) => (
                <div key={`original-${index}`} className="flex-none w-80 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-300 to-rose-300 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic text-sm leading-relaxed">"{testimonial.review}"</p>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {testimonials.map((testimonial, index) => (
                <div key={`duplicate-${index}`} className="flex-none w-80 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-300 to-rose-300 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic text-sm leading-relaxed">"{testimonial.review}"</p>
                </div>
              ))}
            </div>
            
            {/* Gradient fade effects */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-rose-50 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-pink-50 to-transparent pointer-events-none"></div>
          </div>
          
          <div className="text-center mt-6 flex items-center justify-center space-x-3">
            <div className="text-2xl animate-bounce">
              <span className="inline-block animate-pulse">👋🏻</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Faites défiler pour voir plus de témoignages
            </p>
            <div className="text-2xl animate-bounce animation-delay-500">
              <span className="inline-block animate-pulse" style={{animationDelay: '0.5s'}}>👋🏻</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Contact */}
      <section id="contact" ref={contactRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous souhaitez en savoir plus ?</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Contactez notre équipe pour découvrir les options d'adhésion et les parcours de formation spécialisés.
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Accompagnement personnalisé</h4>
                    <p className="text-sm text-gray-600">Bénéficiez d'un suivi individuel et de conseils adaptés à votre parcours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <UserCheck className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Parcours de certification</h4>
                    <p className="text-sm text-gray-600">Suivez les cours et obtenez des certificats</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contactez-nous</h3>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Merci !</h4>
                    <p className="text-gray-600">Nous avons bien reçu votre message et nous vous contacterons rapidement.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                      {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="formation" className="block text-sm font-medium text-gray-700 mb-1">Type de formation</label>
                      <select
                        id="formation"
                        name="formation"
                        value={selectedFormation}
                        onChange={e => setSelectedFormation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      >
                        {formationOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      ></textarea>
                      {formErrors.message && <p className="text-red-500 text-xs mt-1">{formErrors.message}</p>}
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 font-medium flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        'Envoi en cours...'
                      ) : (
                        <>
                          Envoyer sur WhatsApp
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pied de page */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche - Infos contact */}
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center p-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-2">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MediCare Clinic</span>
              </div>
              
              <p className="text-gray-400 mb-6 max-w-md">
                Nous accompagnons les professionnels de la beauté avec des formations expertes en soins du visage, lasers et procédures esthétiques avancées.
              </p>
              
              <div className="space-y-4 mb-8">
                {/* Téléphone */}
                <div className="flex items-center">
                  <div className="p-2 bg-gray-800 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href="tel:+212524434640" className="text-gray-300 hover:text-pink-400 transition-colors">
                    +212 524 434 640
                  </a>
                </div>
                {/* WhatsApp */}
                <div className="flex items-center">
                  <div className="p-2 bg-gray-800 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <a href="https://wa.me/212661280787" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors">
                    +212 661 280 787
                  </a>
                </div>
                {/* Adresse */}
                <div className="flex items-center">
                  <div className="p-2 bg-gray-800 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <a 
                    href="https://www.google.com/maps?q=31.6376501,+-8.0112558&z=17&hl=fr" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-300 hover:text-pink-400 transition-colors"
                  >
                    N 9 Résidence Ahlam A, Entrée 1, 2ème étage, Av. Yacoub El Mansour, Marrakech 40000
                  </a>
                </div>
              </div>
              
              {/* Réseaux sociaux */}
              <div className="flex space-x-4">
                {/* Facebook */}
                <a 
                  href="https://www.facebook.com/p/Medicare-Clinic-100083241855250/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/medicare_clinic_marrakech/?hl=fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a 
                  href="https://wa.me/212661280787" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>
            {/* Colonne droite - Carte */}
            <div className="h-64 md:h-auto">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.779924761284!2d-8.011255825060234!3d31.637650074571902!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM4JzE1LjYiTiA4wrAwMCczNi42Ilc!5e0!3m2!1sen!2sma!4v1628550897505!5m2!1sen!2sma" 
                className="w-full h-full rounded-lg" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 MediCare Clinic. Tous droits réservés.</p>
            <div className="flex mt-4 md:mt-0 space-x-6">
              <button onClick={() => scrollToSection(featuresRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Formations</button>
              <button onClick={() => scrollToSection(testimonialsRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Témoignages</button>
              <button onClick={() => scrollToSection(contactRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Contact</button>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;