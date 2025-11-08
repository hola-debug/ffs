import { StaggeredMenu } from './ui/StaggeredMenu';
import logoSvg from '../assets/logo.svg';

const menuItems = [
  { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/' },
  { label: 'Transacciones', ariaLabel: 'View transactions', link: '/transactions' },
  { label: 'Ahorros', ariaLabel: 'View savings', link: '/savings' },
  { label: 'Configuración', ariaLabel: 'Settings', link: '/settings' }
];

const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com' },
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' }
];

export default function Header() {
  return (
    <>
      {/* Barra negra fija */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-black z-40" />
      
      {/* Menu que ocupa toda la pantalla */}
      <div className="custom-menu-wrapper" style={{ pointerEvents: 'none' }}>
        <StaggeredMenu
          position="right"
          items={menuItems}
          socialItems={socialItems}
          displaySocials={false}
          displayItemNumbering={true}
          menuButtonColor="#fff"
          openMenuButtonColor="#000"
          changeMenuColorOnOpen={true}
          colors={['#1a1a1a', '#000000']}
          logoUrl={logoSvg}
          accentColor="#5227FF"
          isFixed={true}
          onMenuOpen={() => console.log('Menu opened')}
          onMenuClose={() => console.log('Menu closed')}
        />
      </div>
      
      <style>{`
        .custom-menu-wrapper .staggered-menu-header {
          align-items: center !important;
          height: 80px !important;
          pointer-events: auto !important;
        }
        
        .custom-menu-wrapper .staggered-menu-panel {
          pointer-events: auto !important;
        }
        
        .custom-menu-wrapper .sm-panel-item {
          font-size: 2rem !important;
        }
        
        .custom-menu-wrapper .sm-panel-item::after {
          font-size: 0.875rem !important;
          top: 0.2em !important;
          right: 1em !important;
          color: #FF0000 !important;
        }
        
        .custom-menu-wrapper .staggered-menu-panel {
          background: #D5D5D5 !important;
        }
        
        @media (max-width: 640px) {
          .custom-menu-wrapper .sm-panel-item {
            font-size: 1.5rem !important;
          }
          
          .custom-menu-wrapper .sm-panel-item::after {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </>
  );
}
