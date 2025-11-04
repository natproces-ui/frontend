'use client';

import { IdentifiantDeposant, InfosContact, Ville } from '@/lib/types';

interface DeposantFormProps {
    deposant: IdentifiantDeposant;
    contact: InfosContact;
    villes: Ville[];
    onUpdateDeposant: (field: string, value: any) => void;
    onUpdateContact: (field: string, value: any) => void;
    onRegenerate: () => void;
}

export default function DeposantForm({
    deposant,
    contact,
    villes,
    onUpdateDeposant,
    onUpdateContact,
    onRegenerate
}: DeposantFormProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Identifiant Déposant</h3>
                <button
                    onClick={onRegenerate}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    🔄 Régénérer
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">IDSCV</label>
                    <input
                        type="text"
                        value={deposant.idscv}
                        onChange={(e) => onUpdateDeposant('idscv', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Type Personne</label>
                    <input
                        type="text"
                        value={deposant.typePersonne}
                        onChange={(e) => onUpdateDeposant('typePersonne', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                        type="text"
                        value={deposant.nom}
                        onChange={(e) => onUpdateDeposant('nom', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Prénom</label>
                    <input
                        type="text"
                        value={deposant.prenom}
                        onChange={(e) => onUpdateDeposant('prenom', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Date Naissance</label>
                    <input
                        type="text"
                        value={deposant.dateNaissance}
                        onChange={(e) => onUpdateDeposant('dateNaissance', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="DD/MM/YYYY"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nationalité</label>
                    <input
                        type="text"
                        value={deposant.nationalite}
                        onChange={(e) => onUpdateDeposant('nationalite', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nature Identifiant</label>
                    <input
                        type="text"
                        value={deposant.natureIdentifiantDeposant}
                        onChange={(e) => onUpdateDeposant('natureIdentifiantDeposant', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Numéro Identifiant</label>
                    <input
                        type="text"
                        value={deposant.numeroIdentifiantDeposant}
                        onChange={(e) => onUpdateDeposant('numeroIdentifiantDeposant', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Est Décédé</label>
                    <select
                        value={deposant.isDecede}
                        onChange={(e) => onUpdateDeposant('isDecede', e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="O">Oui</option>
                        <option value="N">Non</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nombre Héritiers</label>
                    <input
                        type="number"
                        value={deposant.nombreHeritiers}
                        onChange={(e) => onUpdateDeposant('nombreHeritiers', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nombre Comptes</label>
                    <input
                        type="number"
                        value={deposant.nombreComptes}
                        onChange={(e) => onUpdateDeposant('nombreComptes', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
            </div>

            <div className="border-t pt-6">
                <h4 className="text-md font-semibold mb-4">Informations Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Adresse 1</label>
                        <input
                            type="text"
                            value={contact.adresse1 || ''}
                            onChange={(e) => onUpdateContact('adresse1', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Adresse 2</label>
                        <input
                            type="text"
                            value={contact.adresse2 || ''}
                            onChange={(e) => onUpdateContact('adresse2', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ville</label>
                        <select
                            value={contact.ville || ''}
                            onChange={(e) => onUpdateContact('ville', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        >
                            {villes.map((v) => (
                                <option key={v.code} value={v.code}>
                                    {v.ville} ({v.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Pays</label>
                        <input
                            type="text"
                            value={contact.pays || ''}
                            onChange={(e) => onUpdateContact('pays', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mobile</label>
                        <input
                            type="text"
                            value={contact.mobile || ''}
                            onChange={(e) => onUpdateContact('mobile', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Fixe</label>
                        <input
                            type="text"
                            value={contact.fixe || ''}
                            onChange={(e) => onUpdateContact('fixe', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => onUpdateContact('email', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}