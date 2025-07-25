'use client';
import { editPrinter, removePrinter } from '@/lib/printers';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlView from '@/app/components/ControlView';
import FilesView from '@/app/components/FilesView';
import FilamentView from '@/app/components/FilamentView';
import HMSView from '@/app/components/HMSView';
import SettingsView from '@/app/components/SettingsView';
import React from 'react';

interface PrinterPageProps {
  params: {
    printer: string;
  };
}

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  password: string;
  serial: string;
  status: string;
}

export default function MainView({ params }: PrinterPageProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [activeView, setActiveView] = useState<'files' | 'settings' | 'filament' | 'control' | 'hms'>('files');
  const [files, setFiles] = useState<File[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPrinters() {
      const res = await fetch('/api/printers');
      if (!res.ok) {
        console.error('Failed to fetch printers');
        return;
      }
      const data = await res.json();
      setPrinters(data);
    }
    fetchPrinters();
  }, []);

  const { slug } = React.use(params);
  const printer = printers.find((p) => p.slug === slug);

  if (!printer) {
    return (
      <div className="p-6 text-center text-gray-300">
        <p>Printer not found.</p>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'files':
        return <FilesView slug={slug} model={printer.model} files={files} setFiles={setFiles} isLoading={filesLoading} setIsLoading={setFilesLoading} error={filesError} setError={setFilesError}/>;
      case 'settings':
        return <SettingsView slug={slug} model={printer.model}/>;
      case 'filament':
        return <FilamentView slug={slug} model={printer.model}/>;
      case 'control':
        return <ControlView slug={slug} model={printer.model}/>;
      case 'hms':
        return <HMSView slug={slug} model={printer.model}/>;
      default:
        return <FilesView slug={slug} model={printer.model} files={files} setFiles={setFiles} isLoading={filesLoading} setIsLoading={setFilesLoading} error={filesError} setError={setFilesError}/>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = {
        name: (document.getElementById('in-name') as HTMLInputElement).value,
        model: (document.getElementById('in-model') as HTMLSelectElement).value,
        ip: (document.getElementById('in-ip') as HTMLInputElement).value,
        pwd: (document.getElementById('in-pwd') as HTMLInputElement).value,
        serial: (document.getElementById('in-sn') as HTMLInputElement).value
      };

      if (!data.name) data.name = printer.name;
      if (!data.model) data.model = printer.model;
      if (!data.ip) data.ip = printer.ip;
      if (!data.serial) data.serial = printer.serial;

      if (!data.ip.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) throw new Error("Invalid IP address")

      await editPrinter({
        oldSlug: slug,
        slug: data.name.toLowerCase().replaceAll(' ', '-'),
        name: data.name, 
        model: data.model, 
        ip: data.ip, 
        password: data.pwd, 
        serial: data.serial});
      setEditOpen(false);
      location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add printer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="w-24 bg-gray-800 p-4 flex flex-col justify-between">
        <div>
          <Link href="/" className="mb-8 flex items-center gap-2 text-white hover:text-gray-300">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <nav className="flex flex-col">
            {[
              { id: 'files', icon: '/file.svg' },
              { id: 'control', icon: '/control.png' },
              { id: 'filament', icon: '/filament.png' },
              { id: 'settings', icon: '/settings.png' },
              { id: 'hms', label: 'HMS', icon: '/hms.png' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeView === item.id? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <img src={item.icon} alt={item.label} className="w-[100%] h-[100%]" />
              </button>
            ))}
          </nav>
        </div>
        <button 
          className="flex justify-center items-center"
          onClick={() => {
            setMenuOpen(!menuOpen);
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-6 h-6 text-white-800 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute bg-gray-700 m-2 bottom-[5%] rounded-md shadow-lg">
            <div 
              className="bg-gray-700 hover:bg-gray-600 rounded-md p-2"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              Edit Printer
            </div>
            <div 
              className="bg-gray-700 text-red-600 hover:bg-gray-600 rounded-md p-2"
              onClick={async () => {
                setMenuOpen(false);
                if (confirm("Are you sure you want to delete this printer from the list?")) {
                  document.getElementsByTagName("body")[0].textContent = 'Deleting...';
                  await removePrinter(slug);
                  window.location.href = "/";
                }
              }}
            >
              Delete Printer
            </div>
          </div>
        )}
        {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <h2 className="text-xl mb-4 text-white">Edit Printer {slug}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex">
                <input 
                  type="text" 
                  id="in-name" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`Name: ${printer.name}`}
                />
                <select className="m-1 bg-gray-700 rounded-sm p-2" id="in-model" defaultValue={printer.model}>
                  <option value="A1">A1</option>
                  <option value="A1M">A1 Mini</option>
                  <option value="P1P">P1P</option>
                  <option value="P1S">P1S</option>
                  <option value="X1">X1</option>
                  <option value="X1C">X1C</option>
                  <option value="X1E">X1E</option>
                  <option value="H2D">H2D</option>
                </select>
              </div>
              <div className="flex flex-col">
                <input 
                  type="text" 
                  id="in-ip" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`IP: ${printer.ip}`}
                />
                <input 
                  type="password" 
                  id="in-pwd" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Password"
                  required
                />
                <input 
                  type="text" 
                  id="in-sn" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`Serial: ${printer.serial}`}
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button 
                type="submit" 
                className="m-1 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Editing...' : 'Finish'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
}