from flask import Flask, render_template, request, redirect, url_for, session, flash
from functools import wraps
import requests
import os

app = Flask(__name__)
app.secret_key = "FLASK_SECRET_KEY_PROYECTO"
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8000")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'token' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def fetch_api(endpoint, method='GET', data=None):
    headers = {"Authorization": f"Bearer {session.get('token')}"}
    try:
        if method == 'GET':
            response = requests.get(f"{FASTAPI_URL}{endpoint}", headers=headers)
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
    return render_template('dashboard.html', active_page='dashboard', topbar_btn_text='+ Nuevo Usuario')

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
        elif action == 'delete':
            id = request.form.get('id')
            fetch_api(f"/admin/usuarios/{id}", method='DELETE')
            flash("Usuario eliminado")
        return redirect(url_for('usuarios'))

    usuarios_data = fetch_api("/admin/usuarios") or []
    roles_data = fetch_api("/admin/roles") or []
    return render_template('usuarios.html', active_page='usuarios', topbar_btn_text='+ Nuevo Usuario', usuarios=usuarios_data, roles=roles_data)

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
    return render_template('menu.html', active_page='menu', topbar_btn_text='+ Nuevo Platillo', menu=menu_data, categorias=categorias_data)

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
        elif action == 'delete':
            id = request.form.get('id')
            fetch_api(f"/admin/ingredientes/{id}", method='DELETE')
            flash("Ingrediente eliminado")
        return redirect(url_for('inventario'))

    inventario_data = fetch_api("/admin/ingredientes") or []
    return render_template('inventario.html', active_page='inventario', topbar_btn_text='+ Registrar Entrada de Stock', inventario=inventario_data)

@app.route('/reportes')
@login_required
def reportes():
    ventas_data = fetch_api("/admin/reportes/ventas")
    if ventas_data is None: return redirect(url_for('login'))
    return render_template('reportes.html', active_page='reportes', topbar_btn_text='+ Nuevo reporte', reportes=ventas_data)

@app.route('/configuracion', methods=['GET', 'POST'])
@login_required
def configuracion():
    if request.method == 'POST':
        data = {
            "nombre_negocio": request.form.get('nombre_negocio'),
            "mensaje_ticket": request.form.get('mensaje_ticket'),
            "impuesto_porcentaje": float(request.form.get('impuesto_porcentaje')),
            "moneda": request.form.get('moneda')
        }
        res = fetch_api("/admin/configuracion", method='PUT', data=data)
        if res: flash("Configuración actualizada")
        return redirect(url_for('configuracion'))

    config_data = fetch_api("/admin/configuracion")
    return render_template('configuracion.html', active_page='configuracion', topbar_btn_text='Guardar Configuración', config=config_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
