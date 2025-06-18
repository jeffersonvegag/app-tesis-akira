import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { StudyMaterial, MaterialUploadForm } from '@/types/advanced';
import { 
  FolderOpen, 
  Plus, 
  ExternalLink, 
  Download, 
  FileText, 
  Video, 
  Image,
  Link,
  Edit,
  Trash2 
} from 'lucide-react';

interface MaterialsManagerProps {
  materials: StudyMaterial[];
  onAddMaterial: (material: MaterialUploadForm) => void;
  onEditMaterial: (materialId: number, material: MaterialUploadForm) => void;
  onDeleteMaterial: (materialId: number) => void;
  userRole: 'instructor' | 'client';
}

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  userRole,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialUploadForm>({
    course_id: 0,
    material_name: '',
    material_link: '',
    material_type: 'drive',
    description: '',
  });

  const resetForm = () => {
    setMaterialForm({
      course_id: 0,
      material_name: '',
      material_link: '',
      material_type: 'drive',
      description: '',
    });
  };

  const handleSubmit = () => {
    if (editingMaterial) {
      onEditMaterial(editingMaterial.material_id, materialForm);
    } else {
      onAddMaterial(materialForm);
    }
    setShowForm(false);
    setEditingMaterial(null);
    resetForm();
  };

  const handleEdit = (material: StudyMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      course_id: material.course_id,
      material_name: material.material_name,
      material_link: material.material_link,
      material_type: material.material_type,
      description: material.description || '',
    });
    setShowForm(true);
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
      case 'youtube':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'drive':
      case 'onedrive':
        return <FolderOpen className="w-5 h-5 text-blue-500" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-500" />;
      default:
        return <Link className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
      case 'youtube':
        return 'bg-red-100 text-red-800';
      case 'drive':
      case 'onedrive':
        return 'bg-blue-100 text-blue-800';
      case 'pdf':
      case 'document':
        return 'bg-green-100 text-green-800';
      case 'image':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Material de Apoyo</h2>
        {userRole === 'instructor' && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingMaterial(null);
              resetForm();
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Subir Material
          </Button>
        )}
      </div>

      {/* Lista de materiales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => (
          <Card key={material.material_id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getIconForType(material.material_type)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(material.material_type)}`}>
                    {material.material_type}
                  </span>
                </div>
                {userRole === 'instructor' && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteMaterial(material.material_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {material.material_name}
              </h3>
              
              {material.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {material.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(material.created_at).toLocaleDateString('es-ES')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(material.material_link, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {materials.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay materiales disponibles
            </h3>
            <p className="text-gray-600">
              {userRole === 'instructor' 
                ? 'Comienza subiendo tu primer material de apoyo'
                : 'El instructor aún no ha subido materiales para este curso'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulario para agregar/editar material */}
      {showForm && userRole === 'instructor' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMaterial ? 'Editar Material' : 'Nuevo Material de Apoyo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Material *</label>
                <input
                  type="text"
                  value={materialForm.material_name}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_name: e.target.value })}
                  placeholder="Ejemplo: Presentación Introducción a React"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Material *</label>
                <select
                  value={materialForm.material_type}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                >
                  <option value="drive">Google Drive</option>
                  <option value="onedrive">OneDrive</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="youtube">YouTube</option>
                  <option value="document">Documento</option>
                  <option value="image">Imagen</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Enlace del Material *</label>
                <input
                  type="url"
                  value={materialForm.material_link}
                  onChange={(e) => setMaterialForm({ ...materialForm, material_link: e.target.value })}
                  placeholder="https://drive.google.com/... o https://1drv.ms/..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="Descripción opcional del material, qué contiene, cómo usarlo..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSubmit}>
                {editingMaterial ? 'Actualizar Material' : 'Subir Material'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setEditingMaterial(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};