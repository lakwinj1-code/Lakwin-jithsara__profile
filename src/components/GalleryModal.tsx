import React, { useEffect, useState } from 'react';
import { ChevronLeft, ExternalLink, X } from 'lucide-react';
import { resolveAssetUrl } from '../data/defaults';
import { GalleryItem } from '../types';
import { SafeImage } from './SafeImage';

interface GalleryModalProps {
  open: boolean;
  items: GalleryItem[];
  ownerName: string;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  open,
  items,
  ownerName,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const publishedItems = items
    .filter((i) => i.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!open) {
      setSelectedIdx(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIdx !== null) setSelectedIdx(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, selectedIdx, onClose]);

  if (!open) return null;

  const activeItem =
    selectedIdx !== null && publishedItems[selectedIdx]
      ? publishedItems[selectedIdx]
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${ownerName} Photos`}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[86vh] bg-zinc-900 border border-white/12 rounded-3xl overflow-hidden flex flex-col text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          {activeItem ? (
            <button
              type="button"
              onClick={() => setSelectedIdx(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>All Photos</span>
            </button>
          ) : (
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Photos &amp; Highlights
              </h2>
              <p className="text-xs text-zinc-400">
                {publishedItems.length} item{publishedItems.length === 1 ? '' : 's'}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close photos"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {activeItem ? (
            <div>
              <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
                <SafeImage
                  src={resolveAssetUrl(activeItem.imageUrl, 'preset:brand')}
                  alt={activeItem.title}
                  className="w-full max-h-[52vh] object-contain mx-auto"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs text-zinc-400">
                  {activeItem.category}
                  {activeItem.year.trim() ? ` · ${activeItem.year.trim()}` : ''}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-white">
                  {activeItem.title}
                </h3>
                {activeItem.description.trim() && (
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    {activeItem.description}
                  </p>
                )}
                {activeItem.externalUrl.trim() && (
                  <a
                    href={activeItem.externalUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 transition-colors whitespace-nowrap"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {publishedItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 cursor-pointer text-left"
                >
                  <SafeImage
                    src={resolveAssetUrl(item.imageUrl, 'preset:brand')}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-xs font-medium text-white truncate">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
