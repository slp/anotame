# -*- coding: utf-8 -*-
import string
import random
import json
import webapp2
from google.appengine.api import users
from google.appengine.ext import db

class Tasks(db.Model):
    name = db.StringProperty()
    category = db.StringProperty()
    priority = db.IntegerProperty()


class Users(db.Model):
    first_name = db.StringProperty()
    last_name = db.StringProperty()
    clear_completed = db.BooleanProperty()


class TaskGetAll(webapp2.RequestHandler):
    def get(self):
        user_session = users.get_current_user()
        
        if user_session:
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if not user_db:
                user_db = Users(key_name=user_session.user_id())
                user_db.first_name = "Nombre"
                user_db.last_name = "Apellido"
                user_db.put()
                task_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(8))
                task_db = Tasks(parent=user_key, key_name=task_id)
                task_db.name = u'Primera tarea: Empezar a usar anotame.es ;-)'
                task_db.category = 'personal'
                task_db.priority = 40
                task_db.put()
                task_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(8))
                task_db = Tasks(parent=user_key, key_name=task_id)
                task_db.name = u'Truco 1: Puedes hacer doble-click sobre una tarea para cambiar el texto'
                task_db.category = 'personal'
                task_db.priority = 40
                task_db.put()
                task_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(8))
                task_db = Tasks(parent=user_key, key_name=task_id)
                task_db.name = u'Truco 2: Utiliza el botón de la izquierda para cambiar la prioridad de una tarea'
                task_db.category = 'personal'
                task_db.priority = 40
                task_db.put()
                task_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(8))
                task_db = Tasks(parent=user_key, key_name=task_id)
                task_db.name = u'Truco 3: Cuando pases el ratón sobre una tarea, aparecerá una "x" a la derecha. Úsala para eliminar dicha tarea'
                task_db.category = 'personal'
                task_db.priority = 40
                task_db.put()
                
                
            clear = False
            if (user_db.clear_completed):
                clear = True

            taskList = [ ]
            faketask = {'taskid': 'nickname', 'taskname': user_session.nickname(), 'category': users.create_logout_url('/')}
            taskList.append(faketask)

            tasks = Tasks.all()
            tasks.ancestor(user_key)
            for task in tasks:
                if clear and task.priority == 50:
                    db.delete(task.key())
                else:
                    t = {'taskid': task.key().name(),
                         'taskname': task.name,
                         'category': task.category,
                         'priority': task.priority}
                    taskList.append(t)

            self.response.headers['Content-Type'] = 'text/json'
            self.response.out.write(json.dumps(taskList))
        else:
            self.response.headers['Content-Type'] = 'text/json'
            faketask = {'taskid': 'login', 'taskname': users.create_login_url('/')}
            self.response.out.write(json.dumps([faketask]))


class TaskAdd(webapp2.RequestHandler):
    def post(self):
        user_session = users.get_current_user()
        req_category = self.request.get('category')
        req_priority = self.request.get('priority')
        req_taskname = self.request.get('taskname')

        if user_session and req_taskname != '':
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if user_db:
                if req_category == 'personal':
                    category = 'personal'
                elif req_category == 'work':
                    category = 'work'
                else:
                    category = 'unsorted'

                if req_priority == '10':
                    priority = 10
                elif req_priority == '20':
                    priority = 20
                elif req_priority == '30':
                    priority = 30
                elif req_priority == '50':
                    priority = 50
                else:
                    priority = 40

                if len(req_taskname) > 150:
                    taskname = req_taskname[:150]
                else:
                    taskname = req_taskname

                task_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(8))
                task_db = Tasks(parent=user_key, key_name=task_id)
                task_db.name = taskname
                task_db.category = category
                task_db.priority = priority
                task_db.put()
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write(task_id)
            else:
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('You are not registered, ' + user_session.user_id())
        else:
            self.response.out.write('Error parsing your request')


class TaskRemove(webapp2.RequestHandler):
    def post(self):
        user_session = users.get_current_user()
        req_taskid = self.request.get('taskid')
        taskid = ''

        if len(req_taskid) < 10:
            taskid = req_taskid

        if user_session and taskid != '':
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if user_db:
                task_key = db.Key.from_path('Tasks', taskid, parent=user_key)
                db.delete(task_key)

                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('Task successfully removed')
            else:
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('You are not registered, ' + user_session.user_id())
        else:
            self.response.out.write('This service requires authentication')


class TaskChangePriority(webapp2.RequestHandler):
    def post(self):
        user_session = users.get_current_user()
        req_priority = self.request.get('priority')
        req_taskid = self.request.get('taskid')
        taskid = ''
        
        if len(req_taskid) < 10:
            taskid = req_taskid

        if user_session and taskid != '':
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if user_db:
                if req_priority == '10':
                    priority = 10
                elif req_priority == '20':
                    priority = 20
                elif req_priority == '30':
                    priority = 30
                elif req_priority == '50':
                    priority = 50
                else:
                    priority = 40

                task_key = db.Key.from_path('Tasks', taskid, parent=user_key)
                task_db = db.get(task_key)
                if task_db:
                    task_db.priority = priority
                    task_db.put()

                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write(taskid)
            else:
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('You are not registered, ' + user_session.user_id())
        else:
            self.response.out.write('Error parsing your request')


class TaskChangeName(webapp2.RequestHandler):
    def post(self):
        user_session = users.get_current_user()
        req_taskname = self.request.get('taskname')
        req_taskid = self.request.get('taskid')
        taskid = ''
        
        if len(req_taskid) < 10:
            taskid = req_taskid

        if user_session and taskid != '':
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if user_db:
                if len(req_taskname) > 150:
                    taskname = req_taskname[:150]
                else:
                    taskname = req_taskname

                task_key = db.Key.from_path('Tasks', taskid, parent=user_key)
                task_db = db.get(task_key)
                if task_db:
                    task_db.name = taskname
                    task_db.put()

                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write(taskid)
            else:
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('You are not registered, ' + user_session.user_id())
        else:
            self.response.out.write('Error parsing your request')


class TaskClearCompleted(webapp2.RequestHandler):
    def post(self):
        user_session = users.get_current_user()

        if user_session:
            user_key = db.Key.from_path('Users', user_session.user_id())
            user_db = db.get(user_key)
            if user_db:
                user_db.clear_completed = True
                user_db.put()

                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('OK')
            else:
                self.response.headers['Content-Type'] = 'text/plain'
                self.response.out.write('You are not registered, ' + user_session.user_id())
        else:
            self.response.out.write('Error parsing your request')


app = webapp2.WSGIApplication([('/task/getall', TaskGetAll),
                               ('/task/add', TaskAdd),
                               ('/task/remove', TaskRemove),
                               ('/task/change/priority', TaskChangePriority),
                               ('/task/change/name', TaskChangeName),
                               ('/task/clearcompleted', TaskClearCompleted)],
                              debug=True)
