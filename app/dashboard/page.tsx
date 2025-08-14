export const dynamic = 'force-dynamic';

"use client";
import { useEffect, useMemo, useState } from "react"; import { supabase } from "@/lib/supabaseClient";
type Doc={id:string;investor_id:string;tipo:"recibo"|"resumen_anual"|"contrato";anio:number;path:string;nombre_mostrar:string;uploaded_at:string;};
export default function Dashboard(){const [userEmail,setUserEmail]=useState("");const [docs,setDocs]=useState<Doc[]>([]);const [loading,setLoading]=useState(true);const [err,setErr]=useState<string|null>(null);const [y,setY]=useState("");
useEffect(()=>{(async()=>{setErr(null);const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return;}
setUserEmail(user.email||"");await supabase.from("investors").upsert({id:user.id,email:user.email}).eq("id",user.id);
const {data,error}=await supabase.from("documents").select("id,investor_id,tipo,anio,path,nombre_mostrar,uploaded_at").order("anio",{ascending:false}).order("uploaded_at",{ascending:false});
if(error)setErr(error.message);else setDocs(data||[]);setLoading(false);})()},[]);
const grouped=useMemo(()=>{const g:{[k:string]:Doc[]}={recibo:[],resumen_anual:[],contrato:[]};docs.forEach(d=>{if(y&&String(d.anio)!==y)return;g[d.tipo].push(d)});return g;},[docs,y]);
const dl=async(doc:Doc)=>{const {data,error}=await supabase.storage.from("docs").createSignedUrl(doc.path,180);if(error||!data?.signedUrl){alert(error?.message||"Error");return;}window.location.href=data.signedUrl;};
if(loading)return <p>Cargando...</p>;if(err)return <p style={{color:"crimson"}}>{err}</p>;
return (<div><h2>Hola {userEmail}</h2><div className="row" style={{margin:"12px 0"}}><label>Filtrar por año</label><input value={y} onChange={e=>setY(e.target.value)} placeholder="Ej: 2025"/></div>
{(["recibo","resumen_anual","contrato"] as const).map(t=>(<section className="card" key={t}><h3>{t==="recibo"?"Recibos":t==="resumen_anual"?"Resumen anual":"Contratos"}</h3>
<div className="grid">{grouped[t].map(doc=>(<div key={doc.id} className="card"><div className="row" style={{justifyContent:"space-between"}}>
<div><b>{doc.nombre_mostrar}</b><div className="badge">{doc.anio}</div></div><button onClick={()=>dl(doc)}>Descargar</button></div></div>))}{grouped[t].length===0&&<p>No hay documentos.</p>}</div></section>))}
<div style={{marginTop:24}}><button onClick={async()=>{await supabase.auth.signOut();window.location.href="/login";}}>Salir</button></div></div>);}
