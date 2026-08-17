/* EyeFit — Drag & drop táctil para reordenar ejercicios (refactor #19 → issue #23)
   Reordena ejercicios del editor de rutina (.edit-ex-row) y de los ejercicios
   pendientes de la sesión (.up-row). Se re-enlaza en cada render.
   Exposición global: window.EyeFit.EventsDrag */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const P = () => EyeFit.Persistence || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};

  function attachDragDrop(){
    const dragMain = document.getElementById("main");
    if(!dragMain) return;
    let _dragFrom = null, _dragOver = null, _dragStartT = null, _mouseX = 0, _mouseY = 0;

    /* Determina el contexto (editar rutina vs sesión) y las filas hermanas */
    function dragCells(fromEl){
      const scope = fromEl.parentElement;
      if(fromEl.classList.contains("edit-ex-row"))
        return [scope.querySelectorAll(".edit-ex-row"), "edit-routine"];
      if(fromEl.classList.contains("up-row"))
        return [scope.querySelectorAll(".up-row"), "Session().session-up"];
      return [ [], null ];
    }

    function startDrag(row, e){
      if(!(row.classList.contains("edit-ex-row") || row.classList.contains("up-row"))) return false;
      if(e && e.target.closest("button,input,select,textarea,.edit-mini,.up-arrow,.ehs-input,.es-input,.edit-ex-body,.edit-ex-actions,.edit-set-row")) return false;
      _dragFrom = row;
      row.classList.add("dragging");
      document.body.classList.add("dragging-active");
      if(e && e.cancelable) e.preventDefault();
      return true;
    }

    function endDragFn(){
      if(!_dragFrom) return;
      if(_dragOver && _dragOver !== _dragFrom){
        const [cells, ctx] = dragCells(_dragFrom);
        const fromIdx = Array.prototype.indexOf.call(cells, _dragFrom);
        const toIdx = Array.prototype.indexOf.call(cells, _dragOver);
        if(fromIdx>=0 && toIdx>=0 && fromIdx !== toIdx){
          applyDragReorder(ctx, fromIdx, toIdx);
        }
      }
      _dragFrom.classList.remove("dragging");
      if(_dragOver){ _dragOver.classList.remove("drag-over"); _dragOver = null; }
      document.body.classList.remove("dragging-active");
      _dragFrom = null;
    }

    function applyDragReorder(ctx, fromIdx, toIdx){
      if(ctx === "edit-routine"){
        const routine = P().getRoutine();
        const dayEx = routine.filter(e=>e.dia===EditR().routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
        const moved = dayEx[fromIdx], target = dayEx[toIdx];
        if(!moved || !target) return;
        const keyMoved = moved.dia+"|"+moved.nombre_es;
        const keyTarget = target.dia+"|"+target.nombre_es;
        const ia = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyMoved);
        const ib = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
        if(ia<0 || ib<0) return;
        EditR().applyRoutineChange(r=>{
          const arr = r.slice();
          const [hit] = arr.splice(ia,1);
          const ib2 = arr.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
          const insertAt = fromIdx < toIdx ? ib2+1 : ib2;
          arr.splice(insertAt,0,hit);
          return arr;
        });
        Router().renderMain();
      } else if(ctx === "Session().session-up" && Session().session){
        const arr = Session().session.exercises.slice();
        const absFrom = Session().session.currentIdx+1+fromIdx;
        const absTo = Session().session.currentIdx+1+toIdx;
        const [hit] = arr.splice(absFrom,1);
        arr.splice(absTo,0,hit);
        Session().session.exercises = arr;
        Session().session.exercises.forEach((ex,i)=>{ ex.orden = i+1; });
        Session().saveSessionState();
        Router().renderMain();
      }
    }

    /* Touch events */
    dragMain.addEventListener("touchstart", (e)=>{
      const row = e.target.closest(".edit-ex-row, .up-row");
      if(!row) return;
      if(startDrag(row, e)){
        const t = e.touches[0];
        _dragStartT = { x:t.clientX, y:t.clientY };
      }
    }, { passive:true });
    dragMain.addEventListener("touchmove", (e)=>{
      if(!_dragFrom) return;
      const t = e.touches[0];
      if(_dragStartT){
        const dy = t.clientY - _dragStartT.y;
        if(Math.abs(dy) < 3) return;
      }
      const targetEl = document.elementFromPoint(t.clientX, t.clientY);
      const overRow = targetEl ? targetEl.closest(".edit-ex-row, .up-row") : null;
      if(overRow && overRow !== _dragOver){
        if(_dragOver) _dragOver.classList.remove("drag-over");
        _dragOver = overRow;
        overRow.classList.add("drag-over");
      }
    }, { passive:true });
    dragMain.addEventListener("touchend", ()=>{
      if(_dragFrom) endDragFn();
      _dragStartT = null;
    }, { passive:true });

    /* Mouse fallback escritorio */
    dragMain.addEventListener("mousedown", (e)=>{
      const row = e.target.closest(".edit-ex-row, .up-row");
      if(!row) return;
      if(startDrag(row, e)){ _mouseX = e.clientX; _mouseY = e.clientY; }
    });
    window.addEventListener("mousemove", (e)=>{
      if(!_dragFrom) return;
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      const overRow = targetEl ? targetEl.closest(".edit-ex-row, .up-row") : null;
      if(overRow && overRow !== _dragOver){
        if(_dragOver) _dragOver.classList.remove("drag-over");
        _dragOver = overRow;
        overRow.classList.add("drag-over");
      }
    });
    window.addEventListener("mouseup", ()=>{ if(_dragFrom) endDragFn(); });
  }

  EyeFit.EventsDrag = { attachDragDrop };
})(typeof window !== "undefined" ? window : globalThis);
