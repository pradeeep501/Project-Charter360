'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STATUSES, PRIORITIES, RACI } from '../lib/constants';
import AiButton from './AiButton';

const PEOPLE_LIST_ID = 'people-datalist';

function RaciCell({ field, task, onChange, onAi }) {
  return (
    <div className="cell small">
      <input
        list={PEOPLE_LIST_ID}
        value={task[field] || ''}
        placeholder="name / role"
        onChange={(e) => onChange({ [field]: e.target.value })}
      />
      <AiButton label="" title={`Suggest ${field}`} onGenerate={() => onAi(field)} />
    </div>
  );
}

function SortableRow({ task, index, onChange, onDelete, onAi }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 5 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`task-row${isDragging ? ' dragging' : ''}`}>
      <div className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        ⠿
      </div>

      <div className="cell">
        <textarea
          rows={2}
          value={task.deliverable}
          placeholder="Deliverable"
          onChange={(e) => onChange({ deliverable: e.target.value })}
        />
      </div>

      <div className="cell">
        <textarea
          rows={2}
          value={task.description}
          placeholder="Description"
          onChange={(e) => onChange({ description: e.target.value })}
        />
        <AiButton label="" title="Draft description" onGenerate={() => onAi('description')} />
      </div>

      <RaciCell field="responsible" task={task} onChange={onChange} onAi={onAi} />
      <RaciCell field="accountable" task={task} onChange={onChange} onAi={onAi} />
      <RaciCell field="consulted" task={task} onChange={onChange} onAi={onAi} />
      <RaciCell field="informed" task={task} onChange={onChange} onAi={onAi} />

      <div className="cell small">
        <input
          type="date"
          value={task.dueDate || ''}
          onChange={(e) => onChange({ dueDate: e.target.value })}
        />
      </div>

      <div className="cell">
        <select value={task.status} onChange={(e) => onChange({ status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          style={{ marginTop: 6 }}
          value={task.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} priority
            </option>
          ))}
        </select>
      </div>

      <button className="rowdel" title="Delete task" onClick={() => onDelete(task.id)}>
        ✕
      </button>
    </div>
  );
}

export default function TaskList({ tasks, people, onChange, onDelete, onReorder, onAi }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(tasks, oldIndex, newIndex));
  }

  return (
    <div className="tasks-wrap">
      <datalist id={PEOPLE_LIST_ID}>
        {(people || []).map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>

      <div className="task-grid">
        <div className="task-row head">
          <div />
          <div>Deliverable</div>
          <div>Description</div>
          {RACI.map((r) => (
            <div key={r.key} className="colhead">
              <span>
                <span className="raci-letter">{r.letter}</span> {r.label}
              </span>
            </div>
          ))}
          <div>Due</div>
          <div>Status / Priority</div>
          <div />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task, index) => (
              <SortableRow
                key={task.id}
                task={task}
                index={index}
                onChange={(patch) => onChange(task.id, patch)}
                onDelete={onDelete}
                onAi={(field) => onAi(task.id, field)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {tasks.length === 0 && (
          <div className="empty">
            No tasks yet. Use <b>✨ Generate charter</b> above, or add a task manually.
          </div>
        )}
      </div>
    </div>
  );
}
