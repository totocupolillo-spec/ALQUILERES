import React, { useState } from 'react';
import { Plus, Building2, Edit, Trash2 } from 'lucide-react';
import { Property, BUILDINGS } from '../App';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface PropertiesManagerProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const PropertiesManager: React.FC<PropertiesManagerProps> = ({
  properties,
  setProperties
}) => {

  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [formData, setFormData] = useState<Property>({
    id: Date.now(),
    name: '',
    type: 'departamento',
    building: 'Ramos Mejia',
    address: '',
    rent: 0,
    expenses: 0,
    tenant: null,
    status: 'disponible',
    contractStart: '',
    contractEnd: '',
    lastUpdated: '',
    notes: ''
  });

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
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Propiedades</h2>
        <button
          onClick={() => {
            setEditingProperty(null);
            setFormData({
              id: Date.now(),
              name: '',
              type: 'departamento',
              building: 'Ramos Mejia',
              address: '',
              rent: 0,
              expenses: 0,
              tenant: null,
              status: 'disponible',
              contractStart: '',
              contractEnd: '',
              lastUpdated: '',
              notes: ''
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="properties">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
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
                      className="bg-white p-4 rounded-xl shadow border hover:bg-blue-50"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">{property.name}</p>
                          <p className="text-sm text-gray-600">
                            {property.building} - {property.address}
                          </p>
                          <p className="text-sm">
                          ${(property.rent ?? 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingProperty(property);
                              setFormData(property);
                              setShowModal(true);
                            }}
                            className="text-blue-600"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">

            <h3 className="text-lg font-semibold">
              {editingProperty ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h3>

            <input
              placeholder="Nombre"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full border p-2 rounded-lg"
            />

            {/* 🔥 DESPLEGABLE EDIFICIOS */}
            <select
              value={formData.building}
              onChange={e => setFormData({ ...formData, building: e.target.value })}
              className="w-full border p-2 rounded-lg"
            >
              {BUILDINGS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <input
              placeholder="Dirección"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full border p-2 rounded-lg"
            />

            <input
              type="number"
              placeholder="Alquiler"
              value={formData.rent}
              onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })}
              className="w-full border p-2 rounded-lg"
            />

            <input
              type="number"
              placeholder="Expensas"
              value={formData.expenses}
              onChange={e => setFormData({ ...formData, expenses: Number(e.target.value) })}
              className="w-full border p-2 rounded-lg"
            />

            <input
              type="date"
              value={formData.contractStart}
              onChange={e => setFormData({ ...formData, contractStart: e.target.value })}
              className="w-full border p-2 rounded-lg"
            />

            <input
              type="date"
              value={formData.contractEnd}
              onChange={e => setFormData({ ...formData, contractEnd: e.target.value })}
              className="w-full border p-2 rounded-lg"
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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