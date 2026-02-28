import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Property, BUILDINGS } from '../App';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface PropertiesManagerProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const emptyProperty = (): Property => ({
  id: Date.now(),
  name: '',
  type: 'departamento',
  building: 'Ramos Mejia',
  address: '',
  rent: 0,
  expenses: 0,
  updateFrequencyMonths: 12,
  tenant: null,
  status: 'disponible',
  contractStart: '',
  contractEnd: '',
  lastUpdated: '',
  notes: ''
});

const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  properties,
  setProperties
}) => {

  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Property>(emptyProperty());

  const handleSave = () => {
    if (!formData.name || !formData.address) return;

    if (editingProperty) {
      setProperties(prev =>
        prev.map(p => p.id === editingProperty.id ? formData : p)
      );
    } else {
      setProperties(prev => [...prev, { ...formData, id: Date.now() }]);
    }

    setShowModal(false);
    setEditingProperty(null);
    setFormData(emptyProperty());
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar propiedad?')) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(properties);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setProperties(items);
  };

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Propiedades</h2>
        <button
          onClick={() => {
            setEditingProperty(null);
            setFormData(emptyProperty());
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
        >
          <Plus size={16} />
          Nueva Propiedad
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="properties">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {properties.map((property, index) => (
                <Draggable
                  key={property.id}
                  draggableId={property.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white rounded-xl shadow border p-5 hover:bg-blue-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{property.name}</p>
                          <p className="text-sm text-gray-500">
                            {property.building} • {property.address}
                          </p>
                          <p className="text-blue-700 font-medium">
                            ${(property.rent ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Actualización cada {property.updateFrequencyMonths ?? 0} meses
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setEditingProperty(property);
                              setFormData(property);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 space-y-6">

            <h3 className="text-2xl font-bold text-gray-800">
              {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h3>

            <div className="grid grid-cols-2 gap-6">

              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Edificio</label>
                <select
                  value={formData.building}
                  onChange={e => setFormData({ ...formData, building: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {BUILDINGS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Dirección</label>
                <input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Alquiler</label>
                <input
                  type="number"
                  value={formData.rent || ''}
                  onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Expensas</label>
                <input
                  type="number"
                  value={formData.expenses || ''}
                  onChange={e => setFormData({ ...formData, expenses: Number(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Actualización cada cuántos meses
                </label>
                <input
                  type="number"
                  value={formData.updateFrequencyMonths || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      updateFrequencyMonths: Number(e.target.value)
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 12"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Inicio contrato
                </label>
                <input
                  type="date"
                  value={formData.contractStart}
                  onChange={e => setFormData({ ...formData, contractStart: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Fin contrato
                </label>
                <input
                  type="date"
                  value={formData.contractEnd}
                  onChange={e => setFormData({ ...formData, contractEnd: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProperty(null);
                  setFormData(emptyProperty());
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PropertiesManager;