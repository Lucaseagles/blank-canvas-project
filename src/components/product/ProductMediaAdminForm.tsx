import { useEffect, useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { GripVertical, ImagePlus, Play, Save, Trash2, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { saveVideo } from '@/lib/video.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProductMediaAdminFormProps {
  product: any;
  onSaved: () => void;
  onClose: () => void;
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return Array.from(new Set(images.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)));
}

export function ProductMediaAdminForm({ product, onSaved, onClose }: ProductMediaAdminFormProps) {
  const saveVideoFn = useServerFn(saveVideo);
  const [images, setImages] = useState<string[]>(() => normalizeImages(product?.images));
  const [imageUrl, setImageUrl] = useState('');
  const [video, setVideo] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setImages(normalizeImages(product?.images));
    setVideo(null);
    setVideoUrl('');
    setCaption('');
    setSubtitleUrl('');
    setSubtitleText('');
  }, [product]);

  useEffect(() => {
    let active = true;
    if (!product?.id) return () => { active = false; };
    supabase
      .from('video_products')
      .select('video_id, position, videos(id, title, external_url, video_url, caption, subtitle_url, subtitle_text, status)')
      .eq('product_id', product.id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !active || !data) return;
        const current = Array.isArray((data as any).videos) ? (data as any).videos[0] : (data as any).videos;
        if (!current) return;
        setVideo(current);
        setVideoUrl(current.external_url || current.video_url || '');
        setCaption(current.caption || '');
        setSubtitleUrl(current.subtitle_url || '');
        setSubtitleText(current.subtitle_text || '');
      });
    return () => { active = false; };
  }, [product?.id]);

  const canSaveVideo = useMemo(() => videoUrl.trim().length > 0, [videoUrl]);

  const addImage = () => {
    const value = imageUrl.trim();
    if (!value) return;
    if (images.includes(value)) {
      toast.info('Esta imagem já está na galeria.');
      return;
    }
    setImages((current) => [...current, value]);
    setImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const reorderImage = (from: number, to: number) => {
    if (from === to) return;
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const save = async () => {
    if (!product?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('products').update({ images }).eq('id', product.id);
      if (error) throw error;

      if (canSaveVideo) {
        await saveVideoFn({
          data: {
            id: video?.id,
            title: video?.title || `${product.title} — Vídeo do produto`,
            external_url: videoUrl.trim(),
            status: video?.status || 'published',
            caption: caption.trim() || null,
            subtitle_url: subtitleUrl.trim() || null,
            subtitle_text: subtitleText.trim() || null,
            productIds: [product.id],
          },
        });
      } else if (video?.id) {
        await saveVideoFn({
          data: {
            id: video.id,
            title: video.title || `${product.title} — Vídeo do produto`,
            external_url: undefined,
            status: 'archived',
            caption: null,
            subtitle_url: null,
            subtitle_text: null,
            productIds: [],
          },
        });
      }

      toast.success('Mídia do produto salva com sucesso.');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a mídia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" /> Galeria do produto</h3>
          <p className="text-xs text-muted-foreground mt-1">A primeira imagem é a capa. Arraste os cartões para definir a ordem exibida na loja.</p>
        </div>

        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImage(); } }}
            placeholder="https://.../imagem.webp"
            className="h-12 bg-white/5 border-glass-border rounded-xl"
            aria-label="URL da imagem do produto"
          />
          <Button type="button" onClick={addImage} className="h-12 px-5 rounded-xl" aria-label="Adicionar imagem">
            <ImagePlus className="h-4 w-4" />
          </Button>
        </div>

        {images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border p-8 text-center text-sm text-muted-foreground">Nenhuma imagem adicionada. O produto usará o fallback da loja.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => { if (dragIndex !== null) reorderImage(dragIndex, index); setDragIndex(null); }}
                onDragEnd={() => setDragIndex(null)}
                className="group relative overflow-hidden rounded-2xl border border-glass-border bg-white/5 aspect-square cursor-grab active:cursor-grabbing"
              >
                <img src={url} alt={`Imagem ${index + 1} de ${product.title}`} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.opacity = '0.25'; }} />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 bg-gradient-to-b from-black/70 to-transparent">
                  <span className="rounded-lg bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest">{index === 0 ? 'Capa' : `#${index + 1}`}</span>
                  <GripVertical className="h-4 w-4 text-white/80" aria-hidden="true" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)} className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-black/60 text-white hover:bg-destructive hover:text-white" aria-label={`Remover imagem ${index + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5 border-t border-glass-border pt-7">
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Vídeo e legendas</h3>
          <p className="text-xs text-muted-foreground mt-1">Configure o vídeo publicado para este produto, a legenda sobreposta e o arquivo VTT sincronizado.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-product-video-url">URL do vídeo</Label>
          <div className="relative">
            <Play className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="admin-product-video-url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://...video.mp4" className="h-12 pl-10 bg-white/5 border-glass-border rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-product-video-caption">Legenda sobreposta</Label>
          <Input id="admin-product-video-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} placeholder="Confira esta oferta exclusiva!" className="h-12 bg-white/5 border-glass-border rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-product-subtitle-url">URL da legenda sincronizada (.vtt)</Label>
          <Input id="admin-product-subtitle-url" value={subtitleUrl} onChange={(event) => setSubtitleUrl(event.target.value)} placeholder="https://.../legenda.vtt" className="h-12 bg-white/5 border-glass-border rounded-xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-product-subtitle-text">Texto da legenda / transcrição</Label>
          <Textarea id="admin-product-subtitle-text" value={subtitleText} onChange={(event) => setSubtitleText(event.target.value)} maxLength={10000} placeholder="Texto opcional exibido abaixo do vídeo." className="min-h-28 bg-white/5 border-glass-border rounded-xl resize-y" />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-glass-border pt-5">
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="button" onClick={save} disabled={saving} className="gap-2 rounded-xl font-black uppercase tracking-widest">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar mídia'}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">A reordenação usa o drag-and-drop nativo do navegador, sem adicionar dependências novas ao projeto.</p>
    </div>
  );
}
