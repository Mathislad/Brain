"""
Service FastAPI — Génération de contrats F5L
Lancer : python3 -m uvicorn main:app --port 8001 --reload
"""

from __future__ import annotations

import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(__file__))
from fill_contract import fill_contract

app = FastAPI(title="Brain Contract Service", version="1.0.0")

TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "public",
    "templates",
    "F5L_Contrat_Abonnement_Template.docx",
)


class ContractRequest(BaseModel):
    client_nom: str
    client_forme_juridique: str = ""
    client_siret: str = ""
    client_adresse: str = ""
    client_representant: str = ""
    client_email: str = ""
    client_telephone: str = ""
    lieu_signature: str = ""
    date_signature: str = ""
    services_souscrits: list[str] = []
    prix_site: str = ""
    prix_seo: str = ""
    prix_ads: str = ""
    prix_fidelite: str = ""
    prix_ia: str = ""
    prix_social: str = ""
    total_mensuel: str = ""
    duree_mois: str = "1"
    date_debut: str = ""
    date_fin: str = ""
    mode_facturation: str = "debut"
    # Annexe A
    site_type: str = ""
    site_nb_pages: str = ""
    site_delai: str = ""
    site_hebergement: str = ""
    site_maintenance: str = ""
    seo_zone: str = ""
    seo_keywords: str = ""
    seo_rapport: str = ""
    ads_plateformes: str = ""
    ads_budget: str = ""
    ads_objectif: str = ""
    ads_zone: str = ""
    ads_rapport: str = ""
    fidelite_plateforme: str = ""
    fidelite_maintenance: str = ""
    fidelite_acces: str = ""
    ia_usecases: str = ""
    ia_numero: str = ""
    ia_rapport: str = ""
    social_plateformes: str = ""
    social_frequence: str = ""
    social_contenus: str = ""
    social_visuels: str = ""
    social_validation: str = ""
    social_rapport: str = ""


@app.get("/health")
def health():
    template_ok = os.path.exists(TEMPLATE_PATH)
    return {"status": "ok", "template_found": template_ok}


@app.post("/fill-contract")
def fill(req: ContractRequest) -> Response:
    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(
            status_code=503,
            detail=f"Template DOCX introuvable : {TEMPLATE_PATH}. "
                   "Lance scripts/convert_template.sh après avoir ajouté le fichier .pages.",
        )
    try:
        docx_bytes = fill_contract(TEMPLATE_PATH, req.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="contrat_{req.client_nom}.docx"'},
    )
