import { Controller, Post, Get, Delete, Param, HttpStatus } from '@nestjs/common';

@Controller('file')
export class FileController {
  @Post('upload')
  uploadFile() {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: {
        url: 'https://minio.platform.local/buckets/uploads/file-xyz.jpg',
        key: 'file-xyz.jpg',
      },
    };
  }

  @Get('download/:key')
  getPresignedUrl(@Param('key') key: string) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: {
        presignedUrl: `https://minio.platform.local/buckets/uploads/${key}?signature=abc`,
      },
    };
  }
}
