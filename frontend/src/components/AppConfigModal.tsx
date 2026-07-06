import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppConfig } from '../types';

interface Props {
  config: AppConfig[];
  onSave: (config: AppConfig[]) => void;
  onClose: () => void;
}

interface RowProps {
  item: AppConfig;
  onChange: (updated: AppConfig) => void;
}

function SortableRow({ item, onChange }: RowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.namespace });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const initials = item.namespace.slice(0, 2).toUpperCase();

  return (
    <div ref={setNodeRef} style={style}>
      <div className="config-row">
        <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
        <button
          className={`toggle-btn ${item.visible ? 'toggle-on' : 'toggle-off'}`}
          onClick={() => onChange({ ...item, visible: !item.visible })}
          aria-label={`toggle ${item.namespace}`}
        />
        <div
          className="row-icon"
          style={{
            background: item.visible ? item.color_bg : 'rgba(255,255,255,0.06)',
            color: item.visible ? item.color_fg : '#555',
          }}
        >
          {initials}
        </div>
        <span className={`row-name ${!item.visible ? 'row-name-muted' : ''}`}>
          {item.namespace}
        </span>
        <div className="color-swatches" style={{ opacity: item.visible ? 1 : 0.35 }}>
          <span className="swatch-label">bg</span>
          <button
            className="swatch"
            style={{ background: item.color_bg }}
            onClick={() => setPickerOpen(p => !p)}
            aria-label="edit colors"
          />
          <span className="swatch-label">fg</span>
          <button
            className="swatch"
            style={{ background: item.color_fg }}
            onClick={() => setPickerOpen(p => !p)}
            aria-label="edit colors"
          />
        </div>
      </div>
      {pickerOpen && (
        <div className="color-picker-row">
          <div className="picker-group">
            <label>Background</label>
            <input
              type="color"
              value={item.color_bg}
              onChange={e => onChange({ ...item, color_bg: e.target.value })}
            />
            <span className="hex-val">{item.color_bg}</span>
          </div>
          <div className="picker-group">
            <label>Icon color</label>
            <input
              type="color"
              value={item.color_fg}
              onChange={e => onChange({ ...item, color_fg: e.target.value })}
            />
            <span className="hex-val">{item.color_fg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppConfigModal({ config, onSave, onClose }: Props) {
  const [items, setItems] = useState<AppConfig[]>(
    [...config].sort((a, b) => a.order - b.order)
  );

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.namespace === active.id);
    const newIndex = items.findIndex(i => i.namespace === over.id);
    setItems(prev => arrayMove(prev, oldIndex, newIndex));
  }

  function handleChange(updated: AppConfig) {
    setItems(prev => prev.map(i => i.namespace === updated.namespace ? updated : i));
  }

  function handleSave() {
    const withOrder = items.map((item, idx) => ({ ...item, order: idx }));
    onSave(withOrder);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Configure apps</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="close">✕</button>
        </div>
        <div className="modal-scroll">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.namespace)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableRow key={item.namespace} item={item} onChange={handleChange} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}