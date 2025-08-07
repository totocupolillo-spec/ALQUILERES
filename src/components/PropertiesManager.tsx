import React, { useState } from 'react';
import { Plus, Building2, MapPin, Edit, Trash2, Eye, Calendar, FileText, Filter, Home, Users as UsersIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Property } from '../App';

interface PropertiesManagerProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const PropertiesManager: React.FC<PropertiesManagerProps> = ({ properties, setProperties }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'disponible' | 'ocupado' | 'mantenimiento'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'building'>('grid');

  const [formData, setFormData] = useState({
    name: '',
    type: 'departamento' as Property['type'],
    building: '',
    address: '',
    rent: '',
    expenses: '',
    contractStart: '',
    contractEnd: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: Property = {
      id: editingProperty ? editingProperty.id : Date.now(),
      name: formData.name,
      type: formData.type,
      building: formData.building,
      address: formData.address,
      rent: parseFloat(formData.rent),
      expenses: parseFloat(formData.expenses),
      tenant: editingProperty?.tenant || null,
      status: editingProperty?.status || 'disponible',
      contractStart: formData.contractStart,
      contractEnd: formData.contractEnd,
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: formData.notes
    };

    if (editingProperty) {
      setProperties(properties.map(p => p.id === editingProperty.id ? newProperty : p));
    } else {
      setProperties([...properties, newProperty]);
    }

    setFormData({ 
      name: '', 
      type: 'departamento', 
      building: '', 
      address: '', 
      rent: '', 
      expenses: '', 
      contractStart: '', 
      contractEnd: '', 
      notes: '' 
    });
    setShowModal(false);
    setEditingProperty(null);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      type: property.type,
      building: property.building,
      address: property.address,
      rent: property.rent.toString(),
      expenses: property.expenses.toString(),
      contractStart: property.contractStart,
      contractEnd: property.contractEnd,
      notes: property.notes
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta propiedad?')) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'ocupado': return 'bg-green-100 text-green-800';
      case 'disponible': return 'bg-blue-100 text-blue-800';
      case 'mantenimiento': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Property['type']) => {
    const labels = {
      departamento: 'Departamento',
      galpon: 'Galpón',
      local: 'Local',
      oficina: 'Oficina',
      otro: 'Otro'
    };
    return labels[type];
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(properties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProperties(items);
  };

  // Filtrar propiedades según el estado seleccionado
  const filteredProperties = properties.filter(property => {
    if (filterStatus === 'all') return true;
    return property.status === filterStatus;
  });

  // Agrupar propiedades por edificio
  const propertiesByBuilding = properties.reduce((acc, property) => {
    if (!acc[property.building]) {
      acc[property.building] = [];
    }
    acc[property.building].push(property);
    return acc;
  }, {} as Record<string, Property[]>);

  const getStatusCount = (status: Property['status']) => {
    return properties.filter(p => p.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Propiedades</h2>
          <p className="text-gray-600">Gestiona todas tus propiedades en alquiler</p>
        </div>
        <button
          onClick={() => {
            setFormData({ 
              name: '', 
              type: 'departamento', 
              building: '', 
              address: '', 
              rent: '', 
              expenses: '', 
              contractStart: '', 
              contractEnd: '', 
              notes: '' 
            });
            setEditingProperty(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Propiedad</span>
        </button>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas ({properties.length})
              </button>
              <button
                onClick={() => setFilterStatus('disponible')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'disponible'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Disponibles ({getStatusCount('disponible')})
              </button>
              <button
                onClick={() => setFilterStatus('ocupado')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'ocupado'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ocupadas ({getStatusCount('ocupado')})
              </button>
              <button
                onClick={() => setFilterStatus('mantenimiento')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'mantenimiento'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mantenimiento ({getStatusCount('mantenimiento')})
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Vista:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Home className="h-4 w-4 inline mr-1" />
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('building')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'building'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-1" />
              Por Edificio
            </button>
          </div>
        </div>
      </div>

      {/* Properties Display */}
      {viewMode === 'grid' ? (
        /* Grid View with Drag and Drop */
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="properties" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProperties.map((property, index) => (
                  <Draggable key={property.id.toString()} draggableId={property.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
                          snapshot.isDragging ? 'shadow-lg scale-105 rotate-2' : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                              <p className="text-sm text-gray-500">{getTypeLabel(property.type)}</p>
                              <p className="text-sm text-blue-600 font-medium">{property.building}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="text-sm">{property.address}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Alquiler</p>
                                <p className="font-semibold text-gray-900">${property.rent.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Expensas</p>
                                <p className="font-semibold text-gray-900">${property.expenses.toLocaleString()}</p>
                              </div>
                            </div>

                            {property.tenant && (
                              <div>
                                <p className="text-xs text-gray-500">Inquilino</p>
                                <p className="font-medium text-gray-900">{property.tenant}</p>
                              </div>
                            )}

                            {property.contractStart && property.contractEnd && (
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="text-xs">
                                  {property.contractStart} - {property.contractEnd}
                                </span>
                              </div>
                            )}

                            {property.notes && (
                              <div>
                                <p className="text-xs text-gray-500">Notas</p>
                                <p className="text-sm text-gray-700 truncate">{property.notes}</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              Actualizado: {property.lastUpdated}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(property)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        /* Building View */
        <div className="space-y-6">
          {Object.entries(propertiesByBuilding).map(([building, buildingProperties]) => (
            <div key={building} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{building}</h3>
                      <p className="text-sm text-gray-500">
                        {buildingProperties.length} propiedades • 
                        {buildingProperties.filter(p => p.status === 'ocupado').length} ocupadas • 
                        {buildingProperties.filter(p => p.status === 'disponible').length} disponibles
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <UsersIcon className="h-3 w-3 mr-1" />
                      {buildingProperties.filter(p => p.status === 'ocupado').length} ocupadas
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Home className="h-3 w-3 mr-1" />
                      {buildingProperties.filter(p => p.status === 'disponible').length} disponibles
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildingProperties.map((property) => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{property.name}</h4>
                          <p className="text-sm text-gray-500">{getTypeLabel(property.type)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Alquiler:</span>
                          <span className="font-medium">${property.rent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Expensas:</span>
                          <span className="font-medium">${property.expenses.toLocaleString()}</span>
                        </div>
                        {property.tenant && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Inquilino:</span>
                            <span className="font-medium text-blue-600">{property.tenant}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-1 mt-3 pt-3 border-t border-gray-100">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(property)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProperties.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay propiedades</h3>
          <p className="text-gray-500">
            {filterStatus === 'all' 
              ? 'No hay propiedades registradas.' 
              : `No hay propiedades con estado "${filterStatus}".`
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProperty ? 'Editar Propiedad' : 'Agregar Nueva Propiedad'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Property['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="departamento">Departamento</option>
                    <option value="galpon">Galpón</option>
                    <option value="local">Local</option>
                    <option value="oficina">Oficina</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler ($)</label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expensas ($)</label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de contrato</label>
                  <input
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin de contrato</label>
                  <input
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales sobre la propiedad..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProperty(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProperty ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManager;