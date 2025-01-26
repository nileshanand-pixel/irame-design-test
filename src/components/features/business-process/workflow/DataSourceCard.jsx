// WorkflowPage.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataSourceSelector } from './DataSourceSelector';
import { RefreshCw } from 'lucide-react';
import QueueStatus from '../../new-chat/QueueStatus';
import { ErrorResolutionModal } from './ErrorResolutionModal';
import ValidationOutput from './ValidationOutput';
import VariablesSection from './VariablesSection';

const DataSourceCard = ({ onValidationSuccess, variables }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDataSource, setSelectedDataSource] = useState(null);
    const [validationStatus, setValidationStatus] = useState('idle');
    const [currentValidationText, setCurrentValidationText] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [hasAttemptedResolution, setHasAttemptedResolution] = useState(false);
    const [resolutionFile, setResolutionFile] = useState(null);
    const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  
    const handleErrorClick = (file) => {
      setResolutionFile(file);
      setIsResolutionOpen(true);
    };
  
    const handleResolutionComplete = ({ fileName, mappings }) => {
      setValidationResult((prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.fileName === fileName ? { ...f, status: 'resolved', mappings } : f
        ),
      }));
    };
  
    const handleContinue = (dataSource) => {
      setSelectedDataSource(dataSource);
      setValidationStatus('validating');
    };
  
    const handleOpenModal = () => {
      if (validationStatus === 'validating') return;
  
      if (validationResult || selectedDataSource) {
        const confirm = window.confirm('Your progress will be lost. Do you want to continue?');
        if (!confirm) return;
  
        setSelectedDataSource(null);
        setValidationResult(null);
        setValidationStatus('idle');
      }
  
      setIsModalOpen(true);
    };
  
    const handleRevalidate = () => {
      setHasAttemptedResolution(true);
      setValidationStatus('validating');
    };
  
    return (
      <>
        <Card className="mb-8 text-primary80 border border-black/10 rounded-xl shadow-none">
          <CardHeader>
            <div className="flex justify-between border-b pb-3">
              <div>
                <CardTitle className="text-lg font-semibold">Data Source</CardTitle>
                <CardDescription className="text-sm text-primary60">
                  Securely connect to a datasource
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {validationResult && (
                  <Button
                    variant="outline"
                    className="rounded-lg font-medium"
                    onClick={handleRevalidate}
                    disabled={validationStatus === 'validating'}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-validate
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
                  onClick={handleOpenModal}
                  disabled={validationStatus === 'validating'}
                >
                  {selectedDataSource ? 'Try another data source' : 'Connect Data Source'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationStatus !== 'idle' && (
              <div className="border-b pb-6">
                {validationStatus === 'validating' ? (
                  <div className="flex items-center">
                    <QueueStatus text={currentValidationText} />
                  </div>
                ) : (
                  <ValidationOutput
                    validationResult={validationResult}
                    onErrorClick={handleErrorClick}
                  />
                )}
              </div>
            )}
            <div className="h-48 pb-4 border-b flex items-center justify-center rounded-md">
              <p className="text-gray-500 text-sm">Recommendations will come here</p>
            </div>
            <VariablesSection variables={variables} />
          </CardContent>
        </Card>
        <DataSourceSelector
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onContinue={handleContinue}
        />
        <ErrorResolutionModal
          open={isResolutionOpen}
          onOpenChange={setIsResolutionOpen}
          file={resolutionFile}
          onResolutionComplete={handleResolutionComplete}
        />
      </>
    );
  };

  export default DataSourceCard;