from flask import Flask, render_template, request, redirect, url_for, session, flash, Response
from functools import wraps
import requests
import os

app = Flask(__name__)
app.secret_key = "123456"
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8000")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'token' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def fetch_api(endpoint, method='GET', data=None, params=None, stream=False):
    headers = {"Authorization": f"Bearer {session.get('token')}"}
    try:
        if method == 'GET':
            response = requests.get(f"{FASTAPI_URL}{endpoint}", headers=headers, params=params, stream=stream)
        elif method == 'POST':
            response = requests.post(f"{FASTAPI_URL}{endpoint}", headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(f"{FASTAPI_URL}{endpoint}", headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(f"{FASTAPI_URL}{endpoint}", headers=headers)

        if response.status_code == 401:
            session.pop('token', None)
            return None

        if response.status_code == 204:
            return True

        if stream:
            return response

        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching {endpoint}: {e}")
        return None

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        try:
            response = requests.post(f"{FASTAPI_URL}/auth/login", data={
                "username": username,
                "password": password
            })
            if response.status_code == 200:
                data = response.json()
                if data['usuario']['rol'] != 'ADMINISTRADOR':
                    flash('Acceso denegado. Solo administradores.')
                    return render_template('login.html')
                session['token'] = data['access_token']
                session['usuario'] = data['usuario']
                return redirect(url_for('dashboard'))
            else:
                flash('Credenciales incorrectas.')
        except Exception as e:
            flash(f'Error al conectar con la API: {str(e)}')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    dashboard_data = fetch_api("/admin/reportes/dashboard") or {}
    return render_template('dashboard.html',
        active_page='dashboard',
        data=dashboard_data
    )

@app.route('/usuarios', methods=['GET', 'POST'])
@login_required
def usuarios():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            data = {
                "nombre": request.form.get('nombre'),
                "username": request.form.get('username'),
                "password": request.form.get('password'),
                "rol_id": int(request.form.get('rol_id')),
                "activo": True
            }
            res = fetch_api("/admin/usuarios", method='POST', data=data)
            if res: flash("Usuario creado exitosamente")
            else: flash("Error al crear usuario")
        elif action == 'update':
            id = request.form.get('id')
            data = {}
            if request.form.get('nombre'):
                data['nombre'] = request.form.get('nombre')
            if request.form.get('username'):
                data['username'] = request.form.get('username')
            if request.form.get('password'):
                data['password'] = request.form.get('password')
            if request.form.get('rol_id'):
                data['rol_id'] = int(request.form.get('rol_id'))
            if request.form.get('activo') is not None:
                data['activo'] = request.form.get('activo') == 'true'
            res = fetch_api(f"/admin/usuarios/{id}", method='PUT', data=data)
            if res: flash("Usuario actualizado exitosamente")
            else: flash("Error al actualizar usuario")
        elif action == 'delete':
            id = request.form.get('id')
            fetch_api(f"/admin/usuarios/{id}", method='DELETE')
            flash("Usuario desactivado")
        elif action == 'toggle_status':
            id = request.form.get('id')
            new_status = request.form.get('new_status') == 'true'
            res = fetch_api(f"/admin/usuarios/{id}", method='PUT', data={"activo": new_status})
            if res: flash(f"Usuario {'activado' if new_status else 'desactivado'}")
        return redirect(url_for('usuarios'))

    usuarios_data = fetch_api("/admin/usuarios") or []
    roles_data = fetch_api("/admin/roles") or []
    total_usuarios = len(usuarios_data)
    activos = sum(1 for u in usuarios_data if u.get('activo', False))
    inactivos = total_usuarios - activos
    roles_count = len(roles_data)

    return render_template('usuarios.html',
        active_page='usuarios',
        usuarios=usuarios_data,
        roles=roles_data,
        stats={
            'total': total_usuarios,
            'activos': activos,
            'inactivos': inactivos,
            'roles': roles_count
        }
    )

@app.route('/menu', methods=['GET', 'POST'])
@login_required
def menu():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create':
            data = {
                "nombre": request.form.get('nombre'),
                "descripcion": request.form.get('descripcion'),
                "precio": float(request.form.get('precio')),
                "categoria_id": int(request.form.get('categoria_id')),
                "disponible": True
            }
            res = fetch_api("/admin/menu/productos", method='POST', data=data)
            if res: flash("Producto creado exitosamente")
        elif action == 'delete':
            id = request.form.get('id')
            fetch_api(f"/admin/menu/productos/{id}", method='DELETE')
            flash("Producto eliminado")
        return redirect(url_for('menu'))

    menu_data = fetch_api("/admin/menu/productos") or []
    categorias_data = fetch_api("/admin/menu/categorias") or []
    return render_template('menu.html', active_page='menu', menu=menu_data, categorias=categorias_data)

@app.route('/inventario', methods=['GET', 'POST'])
@login_required
def inventario():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'create':
            data = {
                
                "nombre": request.form.get('nombre'),
                "unidad_medida": request.form.get('unidad_medida'),
                "stock_actual": float(request.form.get('stock_actual')),
                "stock_minimo": float(request.form.get('stock_minimo'))
            }
            
            res = fetch_api("/admin/ingredientes", method='POST', data=data)
            if res: flash("Ingrediente creado exitosamente")
            else: flash("Error al crear ingrediente")
        elif action == 'update':
            id = request.form.get('id')
            data = {}
            
            if request.form.get('nombre'): data['nombre'] = request.form.get('nombre')
            if request.form.get('unidad_medida'): data['unidad_medida'] = request.form.get('unidad_medida')
            if request.form.get('stock_actual'): data['stock_actual'] = float(request.form.get('stock_actual'))
            if request.form.get('stock_minimo'): data['stock_minimo'] = float(request.form.get('stock_minimo'))
            res = fetch_api(f"/admin/ingredientes/{id}", method='PUT', data=data)
            if res: flash("Ingrediente actualizado exitosamente")
            else: flash("Error al actualizar ingrediente")
        elif action == 'delete':
            
            id = request.form.get('id')
            fetch_api(f"/admin/ingredientes/{id}", method='DELETE')
            flash("Ingrediente eliminado")
            
        return redirect(url_for('inventario'))

    inventario_data = fetch_api("/admin/ingredientes") or []
    return render_template('inventario.html', active_page='inventario', inventario=inventario_data)

@app.route('/reportes')
@login_required
def reportes():
    periodo = request.args.get('periodo', 'semana')
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')

    params = {"periodo": periodo}
    if fecha_inicio and fecha_fin:
        params["fecha_inicio"] = fecha_inicio
        params["fecha_fin"] = fecha_fin

    estadisticas = fetch_api("/admin/reportes/estadisticas", params=params) or {
        "periodo": {"inicio": "", "fin": ""},
        "resumen": {"total_ventas": 0, "num_ventas": 0, "ticket_promedio": 0},
        "grafica_ventas": {"labels": [], "data": []},
        "productos_top": [],
        "pedidos": []
    }

    return render_template('reportes.html',
        active_page='reportes',
        estadisticas=estadisticas,
        periodo_actual=periodo,
        fecha_inicio=fecha_inicio or '',
        fecha_fin=fecha_fin or ''
    )

@app.route('/reportes/descargar/<formato>')
@login_required
def descargar_reporte(formato):
    if formato not in ('pdf', 'xlsx'):
        flash("Formato no válido")
        return redirect(url_for('reportes'))

    periodo = request.args.get('periodo', 'semana')
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    tipo = request.args.get('tipo', 'ventas')

    params = {"periodo": periodo, "tipo": tipo}
    if fecha_inicio and fecha_fin:
        params["fecha_inicio"] = fecha_inicio
        params["fecha_fin"] = fecha_fin

    api_response = fetch_api(f"/admin/reportes/export/{formato}", params=params, stream=True)

    if api_response is None or (hasattr(api_response, 'status_code') and api_response.status_code != 200):
        flash("Error al generar el reporte")
        return redirect(url_for('reportes'))

    content_type = "application/pdf" if formato == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"reporte_{tipo}.{formato}"

    return Response(
        api_response.content,
        mimetype=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
