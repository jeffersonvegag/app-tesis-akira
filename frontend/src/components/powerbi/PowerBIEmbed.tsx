import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { BarChart3, ExternalLink, RefreshCw } from 'lucide-react';

interface PowerBIEmbedProps {
  reportId: string;
  embedUrl: string;
  accessToken?: string;
  title: string;
  height?: number;
  className?: string;
}

export const PowerBIEmbed: React.FC<PowerBIEmbedProps> = ({
  reportId,
  embedUrl,
  accessToken,
  title,
  height = 400,
  className = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [embedUrl]);

  const refreshReport = () => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const openInNewTab = () => {
    window.open(embedUrl, '_blank', 'noopener,noreferrer');
  };

  if (hasError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {title}
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshReport}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="Actualizar reporte"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={openInNewTab}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center bg-red-50 border-2 border-dashed border-red-200 rounded-lg"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Error al cargar el reporte</p>
              <p className="text-sm text-red-500 mt-2">
                Verifica la configuración de Power BI
              </p>
              <button
                onClick={refreshReport}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshReport}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Actualizar reporte"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={openInNewTab}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg z-10"
              style={{ height: `${height}px` }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Cargando reporte...</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            width="100%"
            height={`${height}px`}
            frameBorder="0"
            allowFullScreen
            className="rounded-lg"
            title={title}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de demostración cuando no hay configuración de Power BI
export const PowerBIDemo: React.FC<{
  title: string;
  description: string;
  height?: number;
  className?: string;
}> = ({ title, description, height = 400, className = '' }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        <div
          className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300"
          style={{ height: `${height}px` }}
        >
          <div className="text-center max-w-md mx-auto p-6">
            <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Reporte de Power BI
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              {description}
            </p>
            <div className="bg-white/50 rounded-md p-3 text-xs text-blue-600">
              <p className="font-medium mb-1">Para configurar Power BI:</p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Configura tu workspace en Power BI</li>
                <li>Obtén el embed URL del reporte</li>
                <li>Configura las variables de entorno</li>
                <li>Implementa la autenticación con Azure AD</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};