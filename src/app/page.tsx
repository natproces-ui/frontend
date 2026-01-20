'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            TNP Agents
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Automatisez votre documentation technique, générez des spécifications et formalisez vos processus métier avec l'IA
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {/* ProcessMate - Clinic + Image to Process */}
          <Link href="/clinic" className="group">
            <div className="bg-white border-2 border-purple-100 rounded-2xl p-8 hover:border-purple-600 hover:shadow-2xl transition-all duration-300 h-full">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">ProcessMate</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Formalisez vos processus métier. Analysez du code WinDev ou uploadez des images de workflow pour générer des diagrammes BPMN professionnels.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-purple-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Code → Flowchart</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Image → BPMN</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                Accéder
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* SFD Generator */}
          <Link href="/sfd" className="group">
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-8 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 h-full">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">SFD Generator</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Générez des Spécifications Fonctionnelles Détaillées automatiquement à partir de vos cahiers des charges. Format classique ou Agile.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Format Classique</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Format Agile (User Stories)</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Export Word professionnel</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                Accéder
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* ScvMaker */}
          <Link href="/scv-test" className="group">
            <div className="bg-white border-2 border-green-100 rounded-2xl p-8 hover:border-green-600 hover:shadow-2xl transition-all duration-300 h-full">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">ScvMaker</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Créez et gérez vos fichiers SCV (Système Cartes Virements) pour les transactions bancaires. Interface simplifiée et validation automatique.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Format bancaire SCV</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Validation automatique</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                Accéder
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Quick Links Section */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Accès rapide
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Clinic Direct Link */}
              <Link href="/clinic" className="flex items-center gap-4 p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Clinic</h3>
                  <p className="text-sm text-gray-600">Analyse de code WinDev</p>
                </div>
                <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Image to Process Direct Link */}
              <Link href="/stt" className="flex items-center gap-4 p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Image to Process</h3>
                  <p className="text-sm text-gray-600">Image → Diagramme BPMN</p>
                </div>
                <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}