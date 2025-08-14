import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({ onFileSelect, accept = ".xls,.xlsx", multiple = false }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className={`p-6 border-2 border-dashed transition-colors ${
      isDragOver ? 'border-primary bg-primary/5' : 'border-border'
    }`}>
      {!selectedFile ? (
        <div
          className="text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload do arquivo bancário</h3>
          <p className="text-muted-foreground mb-4">
            Arraste e solte seu arquivo .xls/.xlsx aqui ou clique para selecionar
          </p>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Selecionar arquivo
            </Button>
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}