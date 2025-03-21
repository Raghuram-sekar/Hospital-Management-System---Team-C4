import random as r

def createMatrix(m,n):
    d = []
    for i in range(m):
        d.append([])
        for j in range(n):
            d[i].append(0)
    return d

def disp(m):
    for i in range(len(m)):
        for j in range(len(m[i])):
            print(m[i][j],end=" ")
        print()

def CreateHospital(A,m,n):
    if m<5 or n<5:
        return A
    if m<8 or n<8:
        for i in range(m):
            A[i][n//2]=1
        A = ver(A,m,n,r.random())
        A = hor(A,m,n,r.random())
        return A
    if m<=n:
        forty = (m*4)//10
        #for j in range(0,m//2+1,min(5,max(3,forty//2))):
        for j in range(0,m-1,min(5,max(3,forty//2))):
            if j!=0:
                for i in range(n):
                    A[m-j-1][i]=1
                for i in range(m):
                    A[i][n-j-1]=1
    else:
        forty = (n*4)//10
        #for j in range(0,n//2+1,min(5,max(3,forty//2))):
        for j in range(0,n-1,min(5,max(3,forty//2))):
            if j!=0:
                for i in range(m):
                    A[i][n-j-1]=1
                for i in range(n):
                    A[m-j-1][i]=1
    A = segment(A,m//2,n//2,0)
    A = CreateHospital(A,m//2+1,n//2+1)
    A = border(A,m//2+1,n//2+1)
    A = ver(A,m,n,r.random())
    A = hor(A,m,n,r.random())
    if m==len(A) and n==len(A[0]):
        A = border(A)
        return corner(A)
    return border(A)

def segment(M,m=None,n=None,v=0):
    if m==None:
        m = len(M)
    if n==None:
        n = len(M[0])

    for i in range(m+1):
        for j in range(n+1):
            M[i][j]=v
    return M

def border(M,x=None,y=None):
    if y==None:
        y = len(M)-1
    if x==None:
        x = len(M[0])-1
    #b = '\u25a2'
    for i in range(y+1):
        M[i][x]=1
        M[i][0]=1
    for i in range(x+1):
        M[y][i]=1
        M[0][i]=1
    return M

def ver(A,m=None,n=None,p=1):
    if m==None:
        m = len(A)
    if n==None:
        n = len(A[0])

    if r.random()<=p:
        for i in range(m):
            a = A[i]
            A[i] = a[n::-1]+a[n+1:]
    return A

def tra(A):
    B = createMatrix(len(A[0]),len(A))
    for i in range(len(A)):
        for j in range(len(A[i])):
            B[j][i]=A[i][j]
    return B

def hor(A,m=None,n=None,p=1):
    if m==None:
        m = len(A)
    if n==None:
        n = len(A[0])

    B = tra(A)
    B = ver(B,n,m,p)
    return tra(B)

def corner(A):
    for i in range(1,len(A)):
        for j in range(len(A[i])-1):
            if A[i-1][j]==1 and A[i-1][j+1]==1 and A[i][j+1]==1:
                A[i][j]="D"
    return A

def compare(A,B):
    if len(A)!=len(B) or len(A[0])!=len(B[0]):
        print("Size not equal, So technically They are 100% not Equal")
        return False
    count=0
    for i in range(len(A)):
        for j in range(len(A[i])):
            if A[i][j]!=B[i][j]:
                count+=1
    temp = len(A)*len(A[0])
    print("Comparison complete")
    print(f"Both A and B are {round((temp-count)/temp*100,2)}% Alike")
    if count==0:
        return True
    return False

'''
A = CreateHospital(createMatrix(10,10),10,10)
disp(A)
A = corner(A)
print()
disp(A)
'''
'''
A = createMatrix(11,9)
A = segment(A,5,5,1)
disp(A)
#A = ver(A)
A = hor(A)
print()
disp(A)
'''
'''
disp(A)
print()
A = ver(A,10,10,1)
disp(A)
print()
A = HF(A,10,5,1)
disp(A)
'''
s = 20
disp(CreateHospital(createMatrix(s,s),s,s))


'''
a = 20
A = createMatrix(a,a)
#disp(segment(A,0,0,4,4))
A = CreateHospital(A,a,a)
disp(A)

print()

b = 20
B = createMatrix(b,b)
B = CreateHospital(B,b,b)
disp(B)

compare(A,B)
'''

