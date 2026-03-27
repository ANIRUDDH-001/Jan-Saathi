import React, { useState } from 'react';
import { VedAvatar, VedAvatarSmall, VedAvatarProfile } from '../components/VedAvatar';

/**
 * Ved Avatar Showcase - Demo page for all avatar variants and states
 * This component is for development/testing purposes only
 * Shows all possible combinations of Ved avatar configurations
 */
export function VedAvatarShowcase() {
  const [heroSpeaking, setHeroSpeaking] = useState(false);
  const [heroListening, setHeroListening] = useState(false);
  const [heroProcessing, setHeroProcessing] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#000080] mb-2">Ved Avatar Showcase</h1>
        <p className="text-muted-foreground">All variants and states of the Jan Saathi avatar</p>
      </div>

      {/* Hero Section Demo */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">Hero Avatar (160px)</h2>
        
        <div className="bg-gradient-to-br from-[#FF9933]/10 via-white to-[#138808]/10 rounded-lg p-12 flex justify-center items-center min-h-[400px]">
          <VedAvatar 
            size={160}
            variant="hero"
            speaking={heroSpeaking}
            listening={heroListening}
            processing={heroProcessing}
            showLabel={true}
            showPlatform={true}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => {
              setHeroSpeaking(!heroSpeaking);
              setHeroListening(false);
              setHeroProcessing(false);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              heroSpeaking 
                ? 'bg-[#FF9933] text-white' 
                : 'bg-white border border-border hover:bg-muted'
            }`}
          >
            Speaking
          </button>
          <button
            onClick={() => {
              setHeroListening(!heroListening);
              setHeroSpeaking(false);
              setHeroProcessing(false);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              heroListening 
                ? 'bg-[#FF9933] text-white' 
                : 'bg-white border border-border hover:bg-muted'
            }`}
          >
            Listening
          </button>
          <button
            onClick={() => {
              setHeroProcessing(!heroProcessing);
              setHeroSpeaking(false);
              setHeroListening(false);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              heroProcessing 
                ? 'bg-[#FF9933] text-white' 
                : 'bg-white border border-border hover:bg-muted'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => {
              setHeroSpeaking(false);
              setHeroListening(false);
              setHeroProcessing(false);
            }}
            className="px-4 py-2 rounded-full font-medium bg-white border border-border hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Profile Avatar Demo */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">Profile Avatar (64px)</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <VedAvatarProfile />
            <div>
              <h3 className="font-semibold">Ramesh Kumar</h3>
              <p className="text-sm text-muted-foreground">ramesh@example.com</p>
              <p className="text-xs text-muted-foreground">Farmer • Bihar • ₹80,000/year</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <VedAvatarProfile speaking={true} />
            <div>
              <h3 className="font-semibold">Ved is Speaking</h3>
              <p className="text-sm text-muted-foreground">With pulse animation</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <VedAvatarProfile processing={true} />
            <div>
              <h3 className="font-semibold">Ved is Processing</h3>
              <p className="text-sm text-muted-foreground">With loading state</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Bubble Avatar Demo */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">Chat Bubble Avatar (32px)</h2>
        
        <div className="space-y-4 max-w-2xl">
          {/* Normal message */}
          <div className="flex gap-2">
            <VedAvatarSmall />
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-5 py-3 shadow-md">
              <p className="text-sm">नमस्ते! मैं वेद हूं, आपका जन साथी। मुझे बताएं — आप कहां रहते हैं?</p>
            </div>
          </div>

          {/* Speaking message */}
          <div className="flex gap-2">
            <VedAvatarSmall speaking={true} />
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-5 py-3 shadow-md">
              <p className="text-sm">Ved is speaking with pulse animation...</p>
            </div>
          </div>

          {/* Processing/Typing */}
          <div className="flex gap-2">
            <VedAvatarSmall processing={true} />
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-5 py-4 shadow-md">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Sizes Demo */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">All Sizes</h2>
        
        <div className="flex flex-wrap items-end justify-center gap-8">
          <div className="text-center">
            <div className="mb-2">
              <VedAvatarSmall />
            </div>
            <p className="text-sm text-muted-foreground">32px</p>
          </div>

          <div className="text-center">
            <div className="mb-2">
              <VedAvatar size={64} />
            </div>
            <p className="text-sm text-muted-foreground">64px</p>
          </div>

          <div className="text-center">
            <div className="mb-2">
              <VedAvatar size={80} />
            </div>
            <p className="text-sm text-muted-foreground">80px</p>
          </div>

          <div className="text-center">
            <div className="mb-2">
              <VedAvatar size={100} />
            </div>
            <p className="text-sm text-muted-foreground">100px</p>
          </div>

          <div className="text-center">
            <div className="mb-2">
              <VedAvatar size={120} />
            </div>
            <p className="text-sm text-muted-foreground">120px</p>
          </div>

          <div className="text-center">
            <div className="mb-2">
              <VedAvatar size={160} />
            </div>
            <p className="text-sm text-muted-foreground">160px</p>
          </div>
        </div>
      </section>

      {/* State Comparison */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">State Comparison (100px)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              <VedAvatar size={100} />
            </div>
            <p className="mt-3 font-medium">Idle</p>
            <p className="text-xs text-muted-foreground">Breathing glow, random blinks</p>
          </div>

          <div className="text-center">
            <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              <VedAvatar size={100} speaking={true} />
            </div>
            <p className="mt-3 font-medium">Speaking</p>
            <p className="text-xs text-muted-foreground">Pulse ring, mouth movement</p>
          </div>

          <div className="text-center">
            <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              <VedAvatar size={100} listening={true} />
            </div>
            <p className="mt-3 font-medium">Listening</p>
            <p className="text-xs text-muted-foreground">Softer pulse, no mouth</p>
          </div>

          <div className="text-center">
            <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              <VedAvatar size={100} processing={true} />
            </div>
            <p className="mt-3 font-medium">Processing</p>
            <p className="text-xs text-muted-foreground">Loading ring, desaturated</p>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">Usage Examples</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Hero Section</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<VedAvatar 
  size={160} 
  variant="hero"
  speaking={isVedSpeaking}
  showLabel={true}
  showPlatform={true}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Chat Message</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<div className="flex gap-2">
  <VedAvatarSmall speaking={message.isSpeaking} />
  <div>{message.text}</div>
</div>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Profile Header</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<div className="flex items-center gap-4">
  <VedAvatarProfile />
  <div>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </div>
</div>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Processing State</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<VedAvatar 
  size={100} 
  processing={isLoading}
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Brand Colors */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-semibold text-[#000080] mb-6">Brand Colors Used</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-full h-24 rounded-lg" style={{ backgroundColor: '#FF9933' }} />
            <p className="mt-2 font-medium">Saffron</p>
            <p className="text-xs text-muted-foreground">#FF9933</p>
          </div>

          <div className="text-center">
            <div className="w-full h-24 rounded-lg border" style={{ backgroundColor: '#FFFFFF' }} />
            <p className="mt-2 font-medium">White</p>
            <p className="text-xs text-muted-foreground">#FFFFFF</p>
          </div>

          <div className="text-center">
            <div className="w-full h-24 rounded-lg" style={{ backgroundColor: '#138808' }} />
            <p className="mt-2 font-medium">Green</p>
            <p className="text-xs text-muted-foreground">#138808</p>
          </div>

          <div className="text-center">
            <div className="w-full h-24 rounded-lg" style={{ backgroundColor: '#000080' }} />
            <p className="mt-2 font-medium">Navy Blue</p>
            <p className="text-xs text-muted-foreground">#000080</p>
          </div>
        </div>
      </section>
    </div>
  );
}
