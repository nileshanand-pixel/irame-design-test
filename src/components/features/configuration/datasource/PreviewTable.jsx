import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PreviewTable = ({ data, form, setForm, width = '200px' }) => {
  const [columns, setColumns] = useState(data.columns);
  const [previewData, setPreviewData] = useState([]);
  const [editColumnIndex, setEditColumnIndex] = useState(null);

  // Fetch and parse CSV data from sample_url
  useEffect(() => {
    if (data.sample_url) {
      fetchCsvData(data.sample_url);
    }
  }, [data.sample_url]);

  const fetchCsvData = async (url) => {
    try {
      const response = await fetch(url);
      const csvText = await response.text();

      // Parse CSV data
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          // Take the first 10 rows of data
          setPreviewData(result.data.slice(0, 10));
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        },
      });
    } catch (error) {
      console.error('Error fetching CSV:', error);
    }
  };

  const handleDescriptionChange = (index, newDescription) => {
    const updatedColumns = [...columns];
    updatedColumns[index].description = newDescription;
    setColumns(updatedColumns);

    setForm({
      ...form,
      hasChanges: true,
      columns: updatedColumns,
    });
  };

  const handleColumnEdit = (index) => {
    setEditColumnIndex(index);
  };

  const handleColumnBlur = () => {
    setEditColumnIndex(null);
  };

  return (
    <div className="w-full max-h-full overflow-x-auto h-full text-primary80">
      <Table className="w-full border overflow-x-scroll border-gray-300">
        <TableHeader className='bg-purple-4 text-primary80'>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={`text-left text-sm text-primary80 font-semibold px-4 border border-gray-300 !w-[${width}]`}
              >
                {column.name}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                onClick={() => handleColumnEdit(index)}
                className={`text-left ${editColumnIndex === index ? 'px-0 border-none': 'px-4 border border-gray-300 cursor-pointer'} text-primary80 !w-[${width}]`}
              >
                {editColumnIndex === index ? (
                  <textarea
                    value={column.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    onBlur={handleColumnBlur}
                    autoFocus
                    className="mt-1 w-full h-full text-wrap p-2 bg-blue-50 resize-none"
                  />
                ) : (
                  <div
                  >
                    {column.description}
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {previewData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="px-4 py-2 border border-gray-300"
                >
                  {row[column.name]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PreviewTable;
