import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TableLoader from '@/components/elements/loading/TableLoader';

const PreviewTable = ({ data, form, setForm, width = '200px' }) => {
  const [columns, setColumns] = useState(data.columns);
  const [previewData, setPreviewData] = useState([]);
  const [editColumnIndex, setEditColumnIndex] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state added

  useEffect(() => {
    fetchFileData();
  }, [data]);

  const fetchFileData = async () => {
    setLoading(true); // Start loader when fetching data
    const { worksheet, filename, metadata, sample_url, url, type } = data;
    let fileUrl;

    // Determine file URL based on type
    if (type === 'excel' && worksheet && metadata?.files?.[`${worksheet}.csv`]) {
      fileUrl = metadata.files[`${worksheet}.csv`].url;
    } else if (type === 'csv' && filename && metadata?.files?.[filename]) {
      fileUrl = metadata.files[filename].url;
    } else if (sample_url) {
      fileUrl = sample_url;
    } else {
      fileUrl = url;
    }

    // Identify file extension for parsing
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    await fetchSheetData(fileUrl, worksheet, fileExtension);
    setLoading(false); // Stop loader once data is fetched and parsed
  };

  const fetchSheetData = async (url, worksheet, fileExtension) => {
    try {
      if (fileExtension === 'csv') {
        // Parse CSV with PapaParse
        const response = await fetch(url);
        const text = await response.text();
        const { data } = Papa.parse(text, { header: true });
        setPreviewData(data.slice(0, 10)); // Preview first 10 rows
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel with SheetJS
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Determine sheet to use
        const sheetName = worksheet || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (sheet) {
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const headers = sheetData[0];
          const rows = sheetData.slice(1, 11);

          const formattedData = rows.map((row) =>
            headers.reduce((acc, header, index) => {
              acc[header] = row[index];
              return acc;
            }, {})
          );

          setPreviewData(formattedData);
        } else {
          console.error(`Worksheet "${sheetName}" not found in the file.`);
        }
      } else {
        console.error('Unsupported file type.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
    <div className="w-full max-h-full overflow-x-scroll pb-4 show-scrollbar h-full text-primary80">
      {loading ? (
        <TableLoader showHeader={false} rowsCount={12}  colsCount={Math.min(columns?.length || 10, 10)}/> // Render loader while loading
      ) : (
        <Table className="w-full border overflow-x-scroll  border-gray-300">
          <TableHeader className='bg-purple-4 text-primary80'>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`text-left text-sm text-primary80 font-semibold px-4 border border-gray-300 !w-[${width}]`}
                >
                  <span className='truncate'>{column.name}</span>
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  onClick={() => handleColumnEdit(index)}
                  className={`text-left ${editColumnIndex === index ? 'px-0 border-none' : 'px-4 border border-gray-300 cursor-pointer'} text-primary80 !w-[${width}]`}
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
                    <div>
                      <span className='truncate'>{column.description}</span>
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
                    <span className='truncate'>{row[column.name]}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default PreviewTable;
