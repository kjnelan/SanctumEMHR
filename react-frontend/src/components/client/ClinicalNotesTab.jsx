import React, { useState } from 'react';
import NotesList from '../notes/NotesList';
import NoteEditor from '../notes/NoteEditor';
import NoteViewer from '../notes/NoteViewer';
import NoteTypeSelector from '../notes/NoteTypeSelector';

function ClinicalNotesTab({ data }) {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNoteType, setSelectedNoteType] = useState(null);
  const [selectedTemplateFormat, setSelectedTemplateFormat] = useState(null);

  const handleCreateNote = () => {
    setView('selectType');
    setSelectedNoteType(null);
    setSelectedTemplateFormat(null);
  };

  const handleNoteTypeSelected = (noteType, templateFormat = null) => {
    setSelectedNoteType(noteType);
    setSelectedTemplateFormat(templateFormat);
    setView('create');
  };

  const handleNoteClick = (noteId, isDraft, noteType) => {
    setSelectedNoteId(noteId);
    setSelectedNoteType(noteType);

    // Drafts open in edit mode, signed notes open in view mode
    if (isDraft) {
      setView('edit');
    } else {
      setView('view');
    }
  };

  const handleEditNote = (noteId) => {
    setSelectedNoteId(noteId);
    setView('edit');
  };

  const handleNoteSaved = () => {
    // Return to list view and refresh
    setView('list');
    setSelectedNoteId(null);
    setSelectedNoteType(null);
    setSelectedTemplateFormat(null);
  };

  const handleClose = () => {
    setView('list');
    setSelectedNoteId(null);
    setSelectedNoteType(null);
    setSelectedTemplateFormat(null);
  };

  // Render different views
  if (view === 'selectType') {
    return (
      <NoteTypeSelector
        onSelect={handleNoteTypeSelected}
        patientId={data?.patient?.pid}
      />
    );
  }

  if (view === 'create') {
    return (
      <NoteEditor
        patientId={data?.patient?.pid}
        noteType={selectedNoteType}
        templateFormat={selectedTemplateFormat}
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'edit') {
    return (
      <NoteEditor
        noteId={selectedNoteId}
        patientId={data?.patient?.pid}
        noteType={selectedNoteType}
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'view') {
    return (
      <NoteViewer
        noteId={selectedNoteId}
        onClose={handleClose}
        onEdit={handleEditNote}
      />
    );
  }

  // Default: List view
  return (
    <NotesList
      patientId={data?.patient?.pid}
      onNoteClick={handleNoteClick}
      onCreateNote={handleCreateNote}
    />
  );
}

export default ClinicalNotesTab;
