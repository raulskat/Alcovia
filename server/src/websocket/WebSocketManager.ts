import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { StudentStatus } from '../types';

export class WebSocketManager {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer, corsOrigin: string | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void)) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Subscribe to student state updates
      socket.on('subscribe_student', (studentId: string) => {
        socket.join(`student:${studentId}`);
        console.log(`Client ${socket.id} subscribed to student ${studentId}`);
      });

      socket.on('unsubscribe_student', (studentId: string) => {
        socket.leave(`student:${studentId}`);
        console.log(`Client ${socket.id} unsubscribed from student ${studentId}`);
      });
    });
  }

  /**
   * Emit student status change event to all clients subscribed to that student
   */
  emitStudentStatusChanged(studentId: string, status: StudentStatus, intervention?: any): void {
    this.io.to(`student:${studentId}`).emit('student_status_changed', {
      student_id: studentId,
      status,
      intervention,
      timestamp: new Date().toISOString(),
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

