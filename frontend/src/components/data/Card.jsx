import { useTranslation } from 'react-i18next';

const CardBase = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
  hoverable = false,
  onClick
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`
        card
        ${hoverable ? 'hover:shadow-medium hover:border-accent-magenta/30 transition-all duration-300 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="text-sm text-warm-brown mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>
    {children}
  </div>
);

const Card = Object.assign(CardBase, {
  Header: CardHeader,
  Body: CardBody
});

export default Card;
