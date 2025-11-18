<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'role_id';
    public $timestamps = true;

    protected $fillable = [
        'role_name',
        'description',
        'level',
    ];

    /**
     * Mối quan hệ với User
     */
    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }

    /**
     * Chuẩn hóa tên role (lowercase, trim)
     */
    protected function normalizedRoleName(): string
    {
        return strtolower(trim($this->role_name ?? ''));
    }

    /**
     * Kiểm tra xem role có phải Admin không
     */
    public function isAdmin()
    {
        return $this->normalizedRoleName() === 'admin';
    }

    /**
     * Kiểm tra role có phải CEO không
     */
    public function isCeo()
    {
        return $this->normalizedRoleName() === 'ceo';
    }

    /**
     * Kiểm tra xem role có phải Unit Manager không
     */
    public function isDeptManager()
    {
        return ($this->normalizedRoleName() === 'manager' && strtolower(trim($this->level ?? '')) === 'unit');
    }


    /**
     * Kiểm tra xem role có phải Manager không
     */
    public function isManager()
    {
        return $this->normalizedRoleName() === 'manager';
    }
    
    /**

     * Kiểm tra xem role có phải Member không
     */
    public function isMember()
    {
        return $this->normalizedRoleName() === 'member';
    }

    /**
     * Kiểm tra xem role có quyền tạo OKR cấp công ty/phòng ban không
     */
    public function canCreateCompanyOKR()
    {
        return $this->isAdmin() || $this->isCeo() || $this->isManager();
    }

    /**
     * Kiểm tra xem role có quyền tạo OKR cá nhân không
     * Tất cả role đều có quyền tạo OKR cá nhân
     */
    public function canCreatePersonalOKR()
    {
        return true; // Ai cũng có quyền tạo OKR cá nhân
    }
}
