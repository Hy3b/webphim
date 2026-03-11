import React, { useState } from 'react';
import TemplateList from './components/TemplateList';
import TemplateSeatEditor from './components/TemplateSeatEditor';

const SeatMapTemplatesPage = () => {
  const [viewState, setViewState] = useState('list');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setViewState('editor');
  };

  const handleBackToList = () => {
    setSelectedTemplate(null);
    setViewState('list');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {viewState === 'list' && (
        <TemplateList onEditTemplate={handleEditTemplate} />
      )}
      {viewState === 'editor' && (
        <TemplateSeatEditor template={selectedTemplate} onBack={handleBackToList} />
      )}
    </div>
  );
};

export default SeatMapTemplatesPage;
